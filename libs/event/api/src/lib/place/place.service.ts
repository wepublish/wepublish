import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Place, Prisma, PrismaClient } from '@prisma/client';
import { AuthSession } from '@wepublish/authentication/api';
import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  PrimeDataLoader,
  SortOrder,
} from '@wepublish/utils/api';
import {
  canManagePlace,
  mayUpdateAnyOrganization,
  organizationIdsOf,
  selectablePlacesWhere,
  visiblePlacesWhere,
} from '../event-scope';
import { geoBoundingBoxWhere } from '../geo-bounding-box';
import { assertValidLocation } from '../location-rules';
import { PlaceDataloaderService } from './place-dataloader.service';
import {
  CreatePlaceInput,
  PlaceArgs,
  PlaceFilter,
  PlaceListArgs,
  PlaceSort,
  UpdatePlaceInput,
} from './place.model';

type Session = AuthSession | null | undefined;

export const MAX_PLACE_NAME_LENGTH = 90;

export const createPlaceOrder = (
  sort: PlaceSort,
  order: SortOrder
): Prisma.PlaceOrderByWithRelationInput[] => {
  const direction = graphQLSortOrderToPrisma(order);
  const column = {
    [PlaceSort.Name]: 'name',
    [PlaceSort.CreatedAt]: 'createdAt',
    [PlaceSort.ModifiedAt]: 'modifiedAt',
  }[sort];

  return [{ [column]: direction }, { id: direction }];
};

export const createPlaceFilter = (
  filter: PlaceFilter | null | undefined,
  session: Session
): Prisma.PlaceWhereInput => ({
  AND: [
    visiblePlacesWhere(session),
    ...[
      filter?.search ?
        { name: { contains: filter.search, mode: 'insensitive' as const } }
      : {},
      filter?.regionId ? { regionId: filter.regionId } : {},
      filter?.organizationId ? { organizationId: filter.organizationId } : {},
      filter?.enabled != null ? { enabled: filter.enabled } : {},
      filter?.selectable ? selectablePlacesWhere(session) : {},
      filter?.mine ?
        { organizationId: { in: organizationIdsOf(session) } }
      : {},
      geoBoundingBoxWhere(filter?.geoBoundingBox),
    ].filter(clause => Object.keys(clause).length),
  ],
});

@Injectable()
export class PlaceService {
  constructor(
    private prisma: PrismaClient,
    private publicContentCache: PublicContentCacheInvalidator
  ) {}

  @PrimeDataLoader(PlaceDataloaderService)
  async getPlace({ id, slug }: PlaceArgs, session: Session) {
    const lookup: Prisma.PlaceWhereInput | null =
      id != null ? { id }
      : slug != null ? { slug }
      : null;

    if (!lookup) {
      throw new BadRequestException('Place id or slug required.');
    }

    const place = await this.prisma.place.findFirst({
      where: { AND: [lookup, visiblePlacesWhere(session)] },
    });

    if (!place) {
      throw new NotFoundException(`Place ${id ?? slug} was not found.`);
    }

    return place;
  }

  @PrimeDataLoader(PlaceDataloaderService)
  async getPlaces(
    {
      filter,
      cursorId,
      sort = PlaceSort.Name,
      order = SortOrder.Ascending,
      take = 10,
      skip,
    }: PlaceListArgs,
    session: Session
  ) {
    const where = createPlaceFilter(filter, session);
    const orderBy = createPlaceOrder(sort, order);

    const [totalCount, places] = await Promise.all([
      this.prisma.place.count({ where }),
      this.prisma.place.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = places.slice(0, getMaxTake(take));
    const firstPlace = nodes[0];
    const lastPlace = nodes[nodes.length - 1];

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage: Boolean(skip),
        hasNextPage: places.length > nodes.length,
        startCursor: firstPlace?.id,
        endCursor: lastPlace?.id,
      },
    };
  }

  @PrimeDataLoader(PlaceDataloaderService)
  async createPlace(input: CreatePlaceInput, session: Session) {
    const organizationId = input.organizationId ?? null;

    if (!canManagePlace(session, organizationId)) {
      throw new ForbiddenException(
        'You may only create places for organisations you are a member of.'
      );
    }

    this.assertMayChangeEnabled(input.enabled, true, session);
    await this.validate(input, null);

    const place = await this.prisma.place.create({
      data: {
        ...input,
        organizationId,
        enabled: input.enabled ?? undefined,
        private: input.private ?? undefined,
        wheelchairAccessible: input.wheelchairAccessible ?? undefined,
        wheelchairAccessibleToilets:
          input.wheelchairAccessibleToilets ?? undefined,
        wheelchairAccessibleParking:
          input.wheelchairAccessibleParking ?? undefined,
      },
    });

    await this.publicContentCache.invalidate('events');

    return place;
  }

  @PrimeDataLoader(PlaceDataloaderService)
  async updatePlace({ id, ...input }: UpdatePlaceInput, session: Session) {
    const existing = await this.findPlaceOrFail(id);

    if (!canManagePlace(session, existing.organizationId)) {
      throw new ForbiddenException(
        'You may only update places of organisations you are a member of.'
      );
    }

    if (
      input.organizationId !== undefined &&
      input.organizationId !== existing.organizationId &&
      !canManagePlace(session, input.organizationId)
    ) {
      throw new ForbiddenException(
        'You may only move places between organisations you are a member of.'
      );
    }

    this.assertMayChangeEnabled(input.enabled, existing.enabled, session);
    await this.validate(input, existing);

    const place = await this.prisma.place.update({
      where: { id },
      data: {
        ...input,
        name: input.name ?? undefined,
        address: input.address ?? undefined,
        zip: input.zip ?? undefined,
        city: input.city ?? undefined,
        enabled: input.enabled ?? undefined,
        private: input.private ?? undefined,
        wheelchairAccessible: input.wheelchairAccessible ?? undefined,
        wheelchairAccessibleToilets:
          input.wheelchairAccessibleToilets ?? undefined,
        wheelchairAccessibleParking:
          input.wheelchairAccessibleParking ?? undefined,
      },
    });

    await this.publicContentCache.invalidate('events');

    return place;
  }

  async deletePlace(id: string, session: Session) {
    const existing = await this.findPlaceOrFail(id);

    if (!canManagePlace(session, existing.organizationId)) {
      throw new ForbiddenException(
        'You may only delete places of organisations you are a member of.'
      );
    }

    const upcomingEvents = await this.prisma.event.count({
      where: {
        placeId: id,
        occurrences: { some: { dateTo: { gte: new Date() } } },
      },
    });

    if (upcomingEvents) {
      throw new BadRequestException(
        `Place ${id} still has ${upcomingEvents} upcoming events.`
      );
    }

    const place = await this.prisma.place.delete({ where: { id } });

    await this.publicContentCache.invalidate('events');

    return place;
  }

  private assertMayChangeEnabled(
    requested: boolean | null | undefined,
    current: boolean,
    session: Session
  ) {
    if (
      requested != null &&
      requested !== current &&
      !mayUpdateAnyOrganization(session)
    ) {
      throw new ForbiddenException(
        'Changing enabled needs CAN_UPDATE_OTHER_ORGANIZATIONS.'
      );
    }
  }

  private async findPlaceOrFail(id: string) {
    const place = await this.prisma.place.findUnique({ where: { id } });

    if (!place) {
      throw new NotFoundException(`Place ${id} was not found.`);
    }

    return place;
  }

  private async validate(
    input: Partial<CreatePlaceInput>,
    existing: Place | null
  ) {
    const merged = { ...existing, ...input };

    if (!merged.name?.trim()) {
      throw new BadRequestException('Name must not be blank.');
    }

    if (merged.name.length > MAX_PLACE_NAME_LENGTH) {
      throw new BadRequestException(
        `Name must not be longer than ${MAX_PLACE_NAME_LENGTH} characters.`
      );
    }

    for (const field of ['address', 'zip', 'city'] as const) {
      if (!merged[field]?.trim()) {
        throw new BadRequestException(`${field} must not be blank.`);
      }
    }

    assertValidLocation(merged);

    if (input.regionId != null && input.regionId !== existing?.regionId) {
      const region = await this.prisma.region.findUnique({
        where: { id: input.regionId },
      });

      if (!region) {
        throw new BadRequestException(
          `Region ${input.regionId} does not exist.`
        );
      }

      if (!region.enabled) {
        throw new BadRequestException(
          `Region ${input.regionId} does not accept new places.`
        );
      }
    }

    if (
      input.organizationId != null &&
      input.organizationId !== existing?.organizationId
    ) {
      const organization = await this.prisma.organization.findUnique({
        where: { id: input.organizationId },
        select: { id: true },
      });

      if (!organization) {
        throw new BadRequestException(
          `Organization ${input.organizationId} does not exist.`
        );
      }
    }

    if (input.slug != null) {
      const owner = await this.prisma.place.findUnique({
        where: { slug: input.slug },
      });

      if (owner && owner.id !== existing?.id) {
        throw new BadRequestException(
          `Slug ${input.slug} is used by another place.`
        );
      }
    }
  }
}

// Teaser components of the live site, ported from its bundle.
import * as S from '../lib/styles';
import { useAppContext } from './AppContext';
import { DateComponent, ResponsiveImage, ShallowLink } from './primitives';

// bundle function `We`
export function Tag({ label, query, onClick }) {
  return (
    <li className={S.tag.Tag}>
      <ShallowLink
        className={S.tag.link}
        onClick={onClick}
        query={query}
      >
        {label}
      </ShallowLink>
    </li>
  );
}

// bundle function `Ze`
export function Tags({ children }) {
  return (
    <div className={`${S.tags.Tags} root`}>
      <ul className={S.tags.tagList}>{children}</ul>
    </div>
  );
}

// bundle function `Re`
export function AuthorsList({ authors }) {
  const context = useAppContext();

  return (
    <ul className={S.authorsList.root}>
      {authors.map((entry, index) => (
        <li
          className={S.authorsList.author}
          key={index}
        >
          <span
            onClick={() =>
              context.action.header.setOpen({
                search: true,
                menu: false,
                submenu: null,
              })
            }
          >
            <ShallowLink query={{ slug: '/', search: entry.author.name }}>
              {entry.author.firstname}
              {entry.author.lastname && <span>{' '}</span>}
              {entry.author.lastname}
            </ShallowLink>
          </span>
        </li>
      ))}
    </ul>
  );
}

// bundle function `$e`
export function ArticleTeaser({
  title,
  teaser_text,
  teaser_image,
  url,
  date,
  style,
  tags,
  authors,
}) {
  const context = useAppContext();
  const openSearch = () =>
    context.action.header.setOpen({ search: true, menu: false, submenu: null });

  return (
    <div className={`${S.articleTeaser.root} style-${style}`}>
      <div className={S.articleTeaser.authorsList}>
        <AuthorsList authors={authors} /> {date && <DateComponent {...date} />}
      </div>
      <ShallowLink
        query={{ slug: url.path }}
        onClick={() =>
          context.action.header.setOpen({
            search: false,
            menu: false,
            submenu: null,
          })
        }
      >
        {(teaser_image && (
          <div className={`${S.articleTeaser.image} style-${style}`}>
            <ResponsiveImage
              {...teaser_image.entity}
              noCaption
            />
          </div>
        )) || (
          <h2 className={`${S.articleTeaser.title} style-${style}`}>
            {(teaser_text && <span>{teaser_text}</span>) || (
              <span>{title}</span>
            )}
          </h2>
        )}
      </ShallowLink>
      <div className={S.articleTeaser.tags}>
        <Tags>
          {tags &&
            tags.map(
              tag =>
                (tag && tag.entity && (
                  <Tag
                    key={tag.entity.uuid}
                    query={{ slug: '/', search: tag.entity.label }}
                    onClick={openSearch}
                    label={tag.entity.label}
                  />
                )) ||
                null
            )}
        </Tags>
      </div>
    </div>
  );
}

// bundle function `ea`
function AgendaTeaserItem({ title, date }) {
  return (
    <li className={S.agendaTeaser.event}>
      <h2 className={S.agendaTeaser.title}>{title}</h2>
      <p className={S.agendaTeaser.date}>
        {' '}
        {date && <DateComponent value={date.value} />}
      </p>
    </li>
  );
}

// bundle function `ta`
export function AgendaTeaser({ data }) {
  return (
    <div className={S.agendaTeaser.root}>
      <ShallowLink query={{ slug: 'agenda' }}>
        <p className={S.agendaTeaser.heading}>Agenda</p>
        <ul className={S.agendaTeaser.events}>
          {data.agenda &&
            data.agenda.events.map(event => (
              <AgendaTeaserItem
                key={event.key}
                {...event}
              />
            ))}
        </ul>
      </ShallowLink>
    </div>
  );
}

import {
  alpha,
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Divider,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { EngagementPlacement } from '@wepublish/editor/api';
import { ComponentType, ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdCampaign,
  MdCardMembership,
  MdLock,
  MdMail,
  MdOutlineTimeline,
  MdPeopleOutline,
} from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';
import {
  ENGAGEMENT_PRESETS,
  EngagementPresetId,
  RESTRICT_PREMIUM_PATH,
} from './presets';
import { summarizeStages } from './summarize-rule';

const PRESET_ORDER: EngagementPresetId[] = [
  'growNewsletter',
  'promoteMemberships',
  'restrictPremium',
  'displayAnnouncement',
];

type PaletteColor = 'info' | 'success' | 'warning' | 'secondary';

const PRESET_LOOK: Record<
  EngagementPresetId,
  { icon: ComponentType; color: PaletteColor }
> = {
  growNewsletter: { icon: MdMail, color: 'info' },
  promoteMemberships: { icon: MdCardMembership, color: 'success' },
  restrictPremium: { icon: MdLock, color: 'warning' },
  displayAnnouncement: { icon: MdCampaign, color: 'secondary' },
};

type PresetFacts = {
  placement: EngagementPlacement;
  audience: string;
  steps: string[];
};

/**
 * A sketch of an article page that shows where the prompt appears. Purely
 * decorative: the card says the same in words.
 */
export const PresetIllustration = ({
  placement,
  accent,
}: {
  placement: EngagementPlacement;
  accent: string;
}) => {
  const theme = useTheme();
  const page = theme.palette.background.paper;
  const line = alpha(theme.palette.text.primary, 0.14);
  const frame = alpha(theme.palette.text.primary, 0.24);
  const textLine = (y: number, width = 112) => (
    <rect
      key={y}
      x={24}
      y={y}
      width={width}
      height={4}
      rx={2}
      fill={line}
    />
  );

  return (
    <Box
      component="svg"
      data-testid="preset-illustration"
      data-placement={placement}
      viewBox="0 0 160 112"
      aria-hidden
      sx={{ width: '100%', maxWidth: 220, height: 'auto', display: 'block' }}
    >
      <rect
        x={8}
        y={4}
        width={144}
        height={104}
        rx={6}
        fill={page}
        stroke={frame}
      />
      <circle
        cx={18}
        cy={12}
        r={2}
        fill={frame}
      />
      <circle
        cx={25}
        cy={12}
        r={2}
        fill={frame}
      />
      <circle
        cx={32}
        cy={12}
        r={2}
        fill={frame}
      />
      <line
        x1={8}
        y1={20}
        x2={152}
        y2={20}
        stroke={frame}
      />

      {placement === EngagementPlacement.Banner && (
        <rect
          x={8.5}
          y={20.5}
          width={143}
          height={12}
          fill={accent}
        />
      )}

      <rect
        x={24}
        y={placement === EngagementPlacement.Banner ? 40 : 30}
        width={80}
        height={7}
        rx={2}
        fill={alpha(theme.palette.text.primary, 0.32)}
      />

      {placement === EngagementPlacement.Inline ?
        <>
          {[44, 51].map(y => textLine(y))}
          <rect
            x={24}
            y={60}
            width={112}
            height={22}
            rx={3}
            fill={alpha(accent, 0.16)}
            stroke={accent}
          />
          <rect
            x={98}
            y={67}
            width={30}
            height={8}
            rx={4}
            fill={accent}
          />
          {[89, 96].map(y => textLine(y))}
        </>
      : placement === EngagementPlacement.Cutoff ?
        <>
          <defs>
            <linearGradient
              id="preset-cutoff-fade"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0"
                stopColor={page}
                stopOpacity={0}
              />
              <stop
                offset="1"
                stopColor={page}
                stopOpacity={1}
              />
            </linearGradient>
          </defs>
          {[44, 51, 58, 65].map(y => textLine(y))}
          <rect
            x={20}
            y={48}
            width={120}
            height={22}
            fill="url(#preset-cutoff-fade)"
          />
          <rect
            x={24}
            y={74}
            width={112}
            height={26}
            rx={3}
            fill={alpha(accent, 0.16)}
            stroke={accent}
          />
          <rect
            x={74}
            y={81}
            width={12}
            height={10}
            rx={2}
            fill={accent}
          />
          <path
            d="M76.5 81v-3a3.5 3.5 0 0 1 7 0v3"
            fill="none"
            stroke={accent}
            strokeWidth={2}
          />
        </>
      : <>
          {(placement === EngagementPlacement.Banner ?
            [54, 61, 68, 75, 82, 89]
          : [44, 51, 58, 65, 72, 79, 86, 93]
          ).map((y, index) => textLine(y, index % 3 === 2 ? 76 : 112))}
        </>
      }

      {placement === EngagementPlacement.Modal && (
        <>
          <rect
            x={8.5}
            y={20.5}
            width={143}
            height={87}
            rx={5}
            fill={alpha(theme.palette.common.black, 0.32)}
          />
          <rect
            x={40}
            y={36}
            width={80}
            height={56}
            rx={4}
            fill={page}
            stroke={accent}
          />
          <rect
            x={52}
            y={46}
            width={56}
            height={5}
            rx={2}
            fill={line}
          />
          <rect
            x={58}
            y={55}
            width={44}
            height={4}
            rx={2}
            fill={line}
          />
          <rect
            x={58}
            y={70}
            width={44}
            height={12}
            rx={6}
            fill={accent}
          />
        </>
      )}
    </Box>
  );
};

const usePresetFacts = (): Record<EngagementPresetId, PresetFacts> => {
  const { t } = useTranslation();

  return useMemo(() => {
    const fromRule = (preset: keyof typeof ENGAGEMENT_PRESETS): PresetFacts => {
      const rule = ENGAGEMENT_PRESETS[preset]();

      return {
        placement: rule.stages[0]?.placement ?? EngagementPlacement.Banner,
        audience: t(`engagement.audience.${rule.audience}`),
        steps: summarizeStages(rule, t),
      };
    };

    return {
      growNewsletter: fromRule('growNewsletter'),
      promoteMemberships: fromRule('promoteMemberships'),
      restrictPremium: {
        placement: EngagementPlacement.Cutoff,
        audience: t('engagement.preset.restrictPremiumAudience'),
        steps: [t('engagement.preset.restrictPremiumStep')],
      },
      displayAnnouncement: fromRule('displayAnnouncement'),
    };
  }, [t]);
};

const Fact = ({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType;
  label: string;
  children: ReactNode;
}) => (
  <Stack
    direction="row"
    sx={{ gap: 1, alignItems: 'flex-start' }}
  >
    <Box
      sx={{ color: 'text.secondary', fontSize: 18, lineHeight: 0, pt: '2px' }}
    >
      <Icon />
    </Box>
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        component="div"
      >
        {label}
      </Typography>
      {children}
    </Box>
  </Stack>
);

export const EngagementPresetCards = ({
  onPick,
}: {
  onPick: (preset: keyof typeof ENGAGEMENT_PRESETS) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const facts = usePresetFacts();

  return (
    // Columns follow the width of the page, not the window: the sidebar takes
    // a good part of it, and four cards need room for their illustrations.
    <Box sx={{ containerType: 'inline-size' }}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: '1fr',
          '@container (min-width: 520px)': {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          },
          '@container (min-width: 1100px)': {
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          },
        }}
      >
        {PRESET_ORDER.map(preset => {
          const { icon: Icon, color } = PRESET_LOOK[preset];
          const accent = theme.palette[color].main;
          const { placement, audience, steps } = facts[preset];

          return (
            <Card
              key={preset}
              variant="outlined"
              data-preset={preset}
              sx={{
                height: '100%',
                transition: theme.transitions.create('border-color'),
                '&:hover': { borderColor: accent },
              }}
            >
              <CardActionArea
                {...(preset === 'restrictPremium' ?
                  { component: RouterLink, to: RESTRICT_PREMIUM_PATH }
                : { onClick: () => onPick(preset) })}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  justifyContent: 'flex-start',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    px: 3,
                    py: 2,
                    bgcolor: alpha(accent, 0.08),
                    borderBottom: `1px solid ${alpha(accent, 0.24)}`,
                  }}
                >
                  <PresetIllustration
                    placement={placement}
                    accent={accent}
                  />
                </Box>

                <CardContent
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{ gap: 1.5, alignItems: 'center' }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: accent,
                        color: theme.palette[color].contrastText,
                        width: 36,
                        height: 36,
                        fontSize: 20,
                      }}
                    >
                      <Icon />
                    </Avatar>
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{ lineHeight: 1.25 }}
                    >
                      {t(`engagement.preset.${preset}`)}
                    </Typography>
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {t(`engagement.preset.${preset}Info`)}
                  </Typography>

                  <Divider />

                  <Fact
                    icon={MdPeopleOutline}
                    label={t('engagement.preset.for')}
                  >
                    <Typography variant="body2">{audience}</Typography>
                  </Fact>

                  <Fact
                    icon={MdOutlineTimeline}
                    label={t('engagement.preset.steps')}
                  >
                    <Box
                      component="ol"
                      sx={{
                        m: 0,
                        pl: steps.length > 1 ? 2.5 : 0,
                        listStyle: steps.length > 1 ? 'decimal' : 'none',
                      }}
                    >
                      {steps.map(step => (
                        <Typography
                          key={step}
                          component="li"
                          variant="body2"
                          sx={{
                            '&::first-letter': { textTransform: 'uppercase' },
                          }}
                        >
                          {step}
                        </Typography>
                      ))}
                    </Box>
                  </Fact>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

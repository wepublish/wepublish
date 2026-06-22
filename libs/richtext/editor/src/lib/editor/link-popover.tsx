import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Popper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import styled from '@emotion/styled';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TbExternalLink, TbLinkPlus } from 'react-icons/tb';
import { useHeadings } from './use-headings';
import * as z from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { equals } from 'ramda';

const ElevatedPopper = styled(Popper)`
  z-index: 100;
`;

const Form = styled(Paper)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  width: 340px;
  padding: ${({ theme }) => theme.spacing(3)};
` as typeof Paper;

const Title = styled.div`
  font-weight: 700;
`;

const RemoveLinkButton = styled(Button)`
  align-self: flex-start;
`;

const Actions = styled('div')`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const CancelButton = styled(Button)`
  background-color: ${({ theme }) => theme.palette.grey[100]};
  color: ${({ theme }) => theme.palette.text.primary};

  &:hover {
    background-color: ${({ theme }) => theme.palette.grey[200]};
  }
`;

const mailTo = 'mailto:';

function getLinkType(
  href: string | undefined,
  headings: ReturnType<typeof useHeadings>
) {
  if (href?.startsWith(mailTo)) {
    return 'email';
  }

  if (
    href?.startsWith('#') &&
    // Manually anchor links are possible
    headings.find(({ id }) => id === href.substring(1))
  ) {
    return 'anchor';
  }

  return 'web';
}

function stripMailto(href: string | undefined) {
  return href?.startsWith(mailTo) ? href.slice(mailTo.length) : href;
}

type LinkPopoverProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
};

const linkSchema = z.union([
  z.object({
    type: z.literal('web'),
    url: z.string().url().or(z.string().startsWith('#')),
    newTab: z.boolean(),
  }),
  z.object({
    type: z.literal('email'),
    url: z.string().email(),
    newTab: z.boolean(),
  }),
  z.object({
    type: z.literal('anchor'),
    url: z.string(),
    newTab: z.boolean(),
  }),
]);

export function LinkPopover({ open, anchorEl, onClose }: LinkPopoverProps) {
  const { t } = useTranslation();
  const headings = useHeadings();

  const editor = useCurrentEditor().editor!;
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      return {
        isLink: editor.isActive('link') ?? false,
        href: editor.getAttributes('link').href,
        target: editor.getAttributes('link').target,
      };
    },
    equalityFn: equals,
  });

  const applyLink = useCallback(
    (url: string, attrs?: { target?: string }) => {
      if (!url) {
        return;
      }

      const { empty } = editor.state.selection;
      const target = attrs?.target ?? editor.getAttributes('link').target;
      const chain = editor.chain().focus().extendMarkRange('link');

      if (empty && !editor.isActive('link')) {
        chain
          .insertContent({
            type: 'text',
            text: url,
            marks: [{ type: 'link', attrs: { href: url, target } }],
          })
          .run();
      } else {
        chain.setLink({ href: url, target }).run();
      }
    },
    [editor]
  );

  const removeLink = useCallback(() => {
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .unsetLink()
      .setMeta('preventAutolink', true)
      .run();
  }, [editor]);

  const { control, handleSubmit, watch, formState, reset, trigger } = useForm<
    z.infer<typeof linkSchema>
  >({
    resolver: zodResolver(linkSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const onSubmit = handleSubmit(({ type, url, newTab }) => {
    applyLink(type === 'email' ? `${mailTo}${url}` : url, {
      target: newTab ? '_blank' : '',
    });
    onClose();
  }, console.warn);

  const linkType = watch('type');

  useEffect(() => {
    reset({
      type: getLinkType(editorState.href, headings),
      url: stripMailto(editorState.href),
      newTab: editorState.isLink ? editorState.target === '_blank' : true,
    } as z.infer<typeof linkSchema>);
  }, [headings, editorState, reset]);

  return (
    <ElevatedPopper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      disablePortal
      onKeyDown={e => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
    >
      <Form
        component="form"
        noValidate
        onSubmit={onSubmit}
      >
        <Typography
          variant="subtitle1"
          component={Title}
        >
          {t('richtext.link.title')}
        </Typography>

        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <FormControl
              size="small"
              fullWidth
            >
              <InputLabel>{t('richtext.link.type')}</InputLabel>
              <Select
                {...field}
                label={t('richtext.link.type')}
                onChange={event => {
                  field.onChange(event);
                  trigger('url');
                }}
              >
                <MenuItem value="web">{t('richtext.link.web')}</MenuItem>
                <MenuItem value="email">{t('richtext.link.email')}</MenuItem>

                {!!headings.length && (
                  <MenuItem value="anchor">
                    {t('richtext.link.anchor')}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          )}
        />

        {linkType === 'anchor' ?
          <Controller
            control={control}
            name="url"
            render={({ field }) => (
              <FormControl
                size="small"
                fullWidth
              >
                <InputLabel>{t('richtext.link.anchor')}</InputLabel>

                <Select
                  {...field}
                  displayEmpty
                  label={t('richtext.link.anchor')}
                >
                  <MenuItem
                    value=""
                    disabled
                  >
                    {t('richtext.link.selectAnchor')}
                  </MenuItem>

                  {headings.map(heading => (
                    <MenuItem
                      key={heading.id}
                      value={`#${heading.id}`}
                    >
                      {heading.text || heading.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        : <Controller
            control={control}
            name="url"
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                autoFocus
                fullWidth
                size="small"
                label={
                  linkType === 'email' ?
                    t('richtext.link.email')
                  : t('richtext.link.url')
                }
                type={linkType === 'email' ? 'email' : 'url'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        size="small"
                        title={t('richtext.link.openLink')}
                        disabled={!field.value}
                        onClick={() => {
                          if (!field.value) {
                            return;
                          }

                          const url =
                            linkType === 'email' ?
                              `${mailTo}${field.value}`
                            : field.value;

                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        <TbExternalLink size={18} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
        }

        <Controller
          control={control}
          name="newTab"
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  {...field}
                  checked={field.value}
                />
              }
              label={t('richtext.link.openInNewTab')}
            />
          )}
        />

        {editorState.isLink && (
          <RemoveLinkButton
            variant="text"
            size="small"
            color="error"
            onClick={() => {
              removeLink();
              onClose();
            }}
          >
            {t('richtext.link.remove')}
          </RemoveLinkButton>
        )}

        <Actions>
          <CancelButton
            fullWidth
            variant="contained"
            disableElevation
            onClick={onClose}
            type="button"
          >
            {t('cancel')}
          </CancelButton>

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disableElevation
            disabled={!formState.isValid}
          >
            {t('save')}
          </Button>
        </Actions>
      </Form>
    </ElevatedPopper>
  );
}

export function LinkPopoverButton({ isLink }: { isLink: boolean }) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        size="small"
        ref={anchorRef}
        color={isLink ? 'primary' : undefined}
        onClick={() => setOpen(true)}
      >
        <TbLinkPlus size={18} />
      </IconButton>

      <LinkPopover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

import {
  CreateBannerActionInput,
  BannerActionRole,
} from '@wepublish/editor/api-v2';
import { useTranslation } from 'react-i18next';
import { Button, Col, Form, Grid, Row, SelectPicker } from 'rsuite';

interface BannerActionListProps {
  actions: CreateBannerActionInput[];
  onAdd: (action: CreateBannerActionInput) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updatedAction: CreateBannerActionInput) => void;
}

export const BannerActionList = ({
  actions,
  onAdd,
  onRemove,
  onUpdate,
}: BannerActionListProps) => {
  const { t } = useTranslation();

  const handleChange = (index: number, field: string, value: string) => {
    const updatedAction = { ...actions[index], [field]: value };
    onUpdate(index, updatedAction);
  };

  return (
    <>
      <Grid fluid>
        <Row>
          <Col xs={5}>{t('banner.form.action.label')}</Col>
          <Col xs={5}>{t('banner.form.action.url')}</Col>
          <Col xs={5}>{t('banner.form.action.style')}</Col>
          <Col xs={5}>{t('banner.form.action.role')}</Col>
          <Col xs={4}>{t('banner.form.actions')}</Col>
        </Row>
        {actions.map((action, index) => (
          <Row>
            <Col xs={5}>
              <Form.Control
                name="label"
                value={action.label}
                onChange={value => handleChange(index, 'label', value)}
              />
            </Col>
            <Col xs={5}>
              <Form.Control
                name="url"
                value={action.url}
                onChange={value => handleChange(index, 'url', value)}
              />
            </Col>
            <Col xs={5}>
              <Form.Control
                name="style"
                value={action.style}
                onChange={value => handleChange(index, 'style', value)}
              />
            </Col>
            <Col xs={5}>
              <SelectPicker
                value={action.role}
                data={Object.values(BannerActionRole).map(role => ({
                  label: t(`banner.actions.role.${role}`),
                  value: role,
                }))}
                cleanable={false}
                onChange={value => handleChange(index, 'role', value as string)}
              />
            </Col>
            <Col xs={4}>
              <Button onClick={() => onRemove(index)}>
                {t('banner.list.delete')}
              </Button>
            </Col>
          </Row>
        ))}

        <Row>
          <Col xs={24}>
            <Button
              onClick={() =>
                onAdd({
                  label: '',
                  url: '',
                  style: '',
                  role: BannerActionRole.Other,
                })
              }
            >
              {t('banner.actions.add')}
            </Button>
          </Col>
        </Row>
      </Grid>
    </>
  );
};

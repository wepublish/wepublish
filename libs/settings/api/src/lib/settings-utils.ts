import { SettingRestriction } from './settings.model';
import { UnprocessableEntityException } from '@nestjs/common';

class InvalidSettingValueError extends UnprocessableEntityException {
  constructor() {
    super('Invalid Setting Data', 'INVALID_SETTING_DATA'); // todo what to do with this?
  }
}

export function checkSettingRestrictions(
  val: unknown,
  restriction: SettingRestriction | undefined
) {
  if (!restriction) {
    return;
  }

  if (restriction.allowedValues?.boolChoice && typeof val !== 'boolean') {
    throw new InvalidSettingValueError();
  }

  if (typeof val === 'number') {
    if (restriction.maxValue && val > restriction.maxValue) {
      throw new InvalidSettingValueError();
    }

    if (restriction.minValue && val < restriction.minValue) {
      throw new InvalidSettingValueError();
    }
  }

  if (typeof val === 'string') {
    if (restriction.inputLength && val.length > restriction.inputLength) {
      throw new InvalidSettingValueError();
    }

    if (
      restriction.allowedValues?.stringChoice &&
      !restriction.allowedValues.stringChoice.includes(val)
    ) {
      throw new InvalidSettingValueError();
    }
  }
}

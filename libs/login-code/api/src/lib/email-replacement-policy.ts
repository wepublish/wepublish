import { LoginCodeSecondFactor } from './login-code-second-factor';

export type EmailReplacementContext = {
  /** The address on file matches a placeholder pattern. */
  placeholderEmail: boolean;
  /** Attribute from the letter the medium asks for, `none` if switched off. */
  secondFactor: LoginCodeSecondFactor;
};

/**
 * Whether a session from a personal login code may replace the address on
 * file, instead of having to confirm it first.
 *
 * An address can look fine and still be dead (outdated, abandoned), so
 * replacing it is not tied to the address looking bad: it needs proof of
 * holding the letter. The single place to extend once more is known about an
 * address (e.g. its email quality).
 */
export const codeSessionMayReplaceEmail = ({
  placeholderEmail,
  secondFactor,
}: EmailReplacementContext): boolean =>
  placeholderEmail || secondFactor !== LoginCodeSecondFactor.none;

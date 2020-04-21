import React from 'react'

import {Modal} from '../atoms/modalView'
import {PrimaryButton} from '../atoms/primaryButton'
import {Interactable} from '../atoms/interactable'
import {cssRule, useStyle} from '@karma.run/react'
import {whenMobile} from '../style/helpers'

const SubmitButtonStyle = cssRule({
  width: '96%',
  display: 'flex',
  justifyContent: 'flex-end',
  marginBottom: '5%'
})

const NewsletterTextStyle = cssRule({
  padding: '30px 4% 0px 3%;',

  ...whenMobile({
    padding: '10px 4% 0px 3%;'
  })
})

export interface NewsletterModalProps {}

export function NewsletterModal({}: NewsletterModalProps) {
  const css = useStyle()

  return (
    <Modal>
      <link
        href="//cdn-images.mailchimp.com/embedcode/classic-10_7.css"
        rel="stylesheet"
        type="text/css"
      />
      <div className={css(NewsletterTextStyle)}>
        <p>
          Du willst wissen, was in Basel läuft, hast aber keine Lust auf das ganze Altpapier
          zuhause? Du willst informiert sein über das Geschehen in der Stadt, hast aber keine Zeit,
          dich durch die Zeitungen und Online-Portale zu pflügen?
        </p>
        <p>
          <strong>Wir von Bajour nehmen dir diese Arbeit ab.</strong> Wir stehen für dich werktags
          um 4.30 Uhr auf und mailen dir um 7 Uhr die wichtigsten regionalen Tagesnews plus unseren
          Senf dazu in einem Basel Briefing.
        </p>
        <p>
          Falls du gerne wissen willst, was die Politik (und die anderen Medien) so verbrochen
          haben: Hier kannst du dich anmelden.
        </p>
      </div>
      <div id="mc_embed_signup">
        <form
          action="https://bajour.us3.list-manage.com/subscribe/post?u=c30add995be4a0a845d9e933a&amp;id=bed6b33c61"
          method="post"
          id="mc-embedded-subscribe-form"
          name="mc-embedded-subscribe-form"
          className="validate"
          target="_blank"
          noValidate>
          <div id="mc_embed_signup_scroll">
            <h2>Anmeldung fürs Basel Briefing</h2>
            <div className="indicates-required">
              <span className="asterisk">*</span> Feld erforderlich
            </div>
            <div className="mc-field-group">
              <label htmlFor="mce-EMAIL">
                E-Mail-Adresse <span className="asterisk">*</span>
              </label>
              <input type="email" name="EMAIL" className="required email" id="mce-EMAIL" />
            </div>
            <div className="mc-field-group">
              <label htmlFor="mce-VORNAME">
                Vorname <span className="asterisk">*</span>
              </label>
              <input type="text" name="VORNAME" className="required" id="mce-VORNAME" />
            </div>
            <div className="mc-field-group">
              <label htmlFor="mce-NACHNAME">
                Nachname <span className="asterisk">*</span>
              </label>
              <input type="text" name="NACHNAME" className="required" id="mce-NACHNAME" />
            </div>
            <div className="mc-field-group size1of2">
              <label htmlFor="mce-PHONE">
                Telefon <span className="asterisk" />
              </label>
              <input type="text" name="PHONE" className="" id="mce-PHONE" />
            </div>
            <div className="mc-field-group size1of2">
              <label htmlFor="mce-GESCHLECHT">
                Geschlecht <span className="asterisk">*</span>
              </label>
              <select
                name="GESCHLECHT"
                className="required"
                id="mce-GESCHLECHT"
                style={{height: '31px'}}>
                <option value=""></option>
                <option value="m">m</option>
                <option value="f">f</option>
                <option value="d">d</option>
              </select>
            </div>
            <div id="mce-responses" className="clear">
              <div className="response" id="mce-error-response" style={{display: 'none'}}></div>
              <div className="response" id="mce-success-response" style={{display: 'none'}}></div>
            </div>
            <div style={{position: 'absolute', left: '-5000px'}} aria-hidden="true">
              <input
                type="text"
                name="b_c30add995be4a0a845d9e933a_bed6b33c61"
                tabIndex={-1}
                defaultValue=""
              />
            </div>
            <div className={`clear ${css(SubmitButtonStyle)}`}>
              <Interactable type="submit" value="Los" name="subscribe">
                <PrimaryButton text={'Subscribe'} />
              </Interactable>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}

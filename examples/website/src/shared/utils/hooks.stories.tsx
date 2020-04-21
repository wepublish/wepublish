import React from 'react'

import {storiesOf} from '@storybook/react'
import {centerLayoutDecorator} from '../.storybook/decorators'
import {cssRule, useStyle} from '@karma.run/react'

const TestStyle = cssRule<{showBackground: boolean}>(({showBackground}) => ({
  width: '200px',
  backgroundColor: showBackground ? 'red' : 'white'
}))

function UseVisiblityExample() {
  const ref = React.createRef<HTMLParagraphElement>()
  //const show = useVisibility(ref, {threshold: 0.5})
  const show = true
  const css = useStyle({showBackground: show})

  return (
    <div className={css(TestStyle)}>
      <p>
        <strong>
          Scroll this section to trigger a red background as soon as the title shows and vice versa.
        </strong>
        <br />
        <br />
        Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor
        invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam
        et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est
        Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed
        diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
        voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd
        gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit
        amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et
        dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores
        et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit
        amet. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie
        consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto
        odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait
        nulla facilisi. Lorem ipsum dolor sit amet.
      </p>
      <h1 ref={ref}>TITLE Lorem ipsum dolor sit amet, consetetur sadipscing elitr</h1>
    </div>
  )
}

storiesOf('Utils|Hooks', module)
  .addDecorator(centerLayoutDecorator())
  .add('useVisibility', () => <UseVisiblityExample />)

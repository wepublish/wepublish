import React from 'react'
import {Button, ButtonToolbar, Form, FormGroup} from 'rsuite'

export function CustomViewExample() {
  return (
    <div>
      <h1>Custom View Example</h1>
      <br></br>
      <br></br>
      <Form>
        <FormGroup>
          <ButtonToolbar>
            <Button>Custom Action</Button>
          </ButtonToolbar>
        </FormGroup>
      </Form>
    </div>
  )
}

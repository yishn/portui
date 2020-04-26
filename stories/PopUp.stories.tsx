import {createElement, Fragment, useState} from 'react'
import {action} from '@storybook/addon-actions'
import PopUp from '../src/PopUp'

export default {
  title: 'PopUp',
  component: PopUp,
}

export const Default = () => {
  let [showPopUp, setShowPopUp] = useState(false)

  return (
    <Fragment>
      <button onClick={evt => setShowPopUp(true)}>Open PopUp</button>

      <PopUp
        style={{background: 'rgba(0, 0, 0, .1)'}}
        show={showPopUp}
        onBackdropClick={action('onBackdropClick')}
      >
        <div
          style={{
            background: 'rgba(0, 0, 0, .1)',
            padding: '.5rem',
          }}
        >
          Hello World!
          <br />
          <button onClick={evt => setShowPopUp(false)}>Close</button>
        </div>
      </PopUp>
    </Fragment>
  )
}

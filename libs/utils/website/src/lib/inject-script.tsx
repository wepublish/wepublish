import { ApiV1 } from '@wepublish/website'
import {useEffect} from 'react'

export function InjectScript() {
  const {data} = ApiV1.useSettingQuery({
    variables: {
      name: 'bodyScript'
    }
  })

  /* Because of the WhatWG HTML specs, article 4.12.1: "When inserted using the
  innerHTML and outerHTML attributes, they do not execute at all.", the scripts
  must be injected differently. The below is one such method and works by
  copying the entire element (tagname, attributes and content) and injecting
  the copy using appendChild.
  */
  useEffect(() => {
    if (data?.setting?.value) {
      // Create a temporary div to parse the script tag
      const temp = document.createElement('div')
      temp.innerHTML = data.setting.value
      const children = temp.children

      for (let i = 0; i < children.length; i++) {
        const tag = children[i] as Element

        // Create a copy
        const newTag = document.createElement(tag.tagName)
        Array.from(tag.attributes).forEach(attr => {
          newTag.setAttribute(attr.name, attr.value)
        })
        newTag.textContent = tag.textContent

        // Append the script to the document body
        document.body.appendChild(newTag)

        return () => {
          document.body.removeChild(newTag)
        }
      }
    }
  }, [data])

  return null
}

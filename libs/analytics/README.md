# WePublish Analytics Plugin

## Overview

This is an analytics plugin for WePublish.
It includes basic configuration and lets you send some tracking information to WePublish's Matomo.

## Installation

`yarn add @wepublish/analytics`
or
`npm install @wepublish/analytics`

## Usage

Import and initialise the tracker anywhere in the project

    import {initWepublishAnalytics, trackPage} from '@wepublish/analytics'

    initWepublishAnalytics({appName: 'wep-example'})

then call the method on page load e.g.

    const { current } = useRoute()

    useEffect(() => {
    	trackPage()
    }, [current])

The tracker will automatically look in the html structure for an element with an id "peer-element" and take data from this element. Example element to send peer tracking data should look like the following:

    <div id="peer-element" data-peer-name="Some peer name" data-peer-article-id="123" data-publisher-name="Your name" />

If you want to track page views and send peer name and peer article id, please make sure that this element is present on the peered article page. Otherwise the tracker won't be called.

## Methods

The package exposes one method that can be called in order to call the tracker - `trackPage()`.
The method is meant to be called on page view. More methods are to be added in the future.

## References

https://github.com/DavidWells/analytics
https://developer.matomo.org/api-reference/tracking-api

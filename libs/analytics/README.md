# WePublish Analytics Plugin

This library was generated with [Nx](https://nx.dev).

## Running unit tests

Run `nx test analytics` to execute the unit tests via [Jest](https://jestjs.io).

## Running lint

Run `nx lint analytics` to execute the lint via [ESLint](https://eslint.org/).

## Overview 

This is an analytics plugin for WePublish. It includes basic configuration and lets you send some tracking information to WePublish's Matomo. Under the hood, it utilises `matomo-tracker` for easier integration.

## Prerequisities

This is a plugin for analytics.js which is required to be installed in your app.
https://github.com/DavidWells/analytics

## Installation

`yarn add @wepublish/analytics`
or
`npm install @wepublish/analytics`

## Usage

Import and initialise the tracker anywhere in the project

    import  Analytics  from  'analytics'
    import { wepublish } from '@wepublish/analytics'
    
    const  analytics = Analytics({
	    app: 'Your app name',
	    plugins: [wepublish()]
    })

then call the method on page load e.g.

    const { current } = useRoute()
    
    useEffect(() => {
    	analytics.page()
    }, [current])

The tracker will automatically look in the html structure for an element with an id "peer-element" and take data from this element. Example element to send peer tracking data should look like the following:

    <div id="peer-element" data-peer-name="Some peer name" data-peer-article-id="123" data-publisher-name="Your name" />

If you want to track page views and send peer name and peer article id, please make sure that this element is present on the peered article page. Otherwise the tracker won't be called.

##  Methods

The package exposes two methods that can be called in order to call the tracker - `track` and `page`. Page method is meant to be called on page view, while track method should be called anywhere else - e.g. on successful request or inside some function. More methods are to be added in the future.

## References
https://github.com/matomo-org/matomo-nodejs-tracker
https://github.com/DavidWells/analytics
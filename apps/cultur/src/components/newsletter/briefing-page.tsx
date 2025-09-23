import { Box } from '@mui/material';
import Head from 'next/head';
import { JSX } from 'react';

interface BriefingPageProps {
  title: string;
  subtitle: string;
  lead: JSX.Element;
  wakeup: JSX.Element;
  ready: JSX.Element;
  delivery: JSX.Element;
  subscribe: JSX.Element;
  independent: JSX.Element;
  mainBackground: string;
  leadColor: string;
  headerBackgroundImage: string;
  readyBackgroundImage?: string;
  readyBackgroundColor: string;
  independentBackgroundImage: string;
  footerBackgroundImage: string;
  blobBackground: string;
  subscribetextBackground: string;
  deliveryBackground: string;
  signupForm: JSX.Element;
}

export default function BriefingPage(props: BriefingPageProps) {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <link
          rel="stylesheet"
          href="/newsletter/styles.css"
        ></link>
        <title>{props.title}</title>
        <meta
          property="og:title"
          content={props.title}
        />
        <meta
          property="og:description"
          content={props.subtitle}
        />
        <meta
          property="og:image"
          content={props.headerBackgroundImage}
        />
      </Head>

      <header
        className="header"
        style={{ backgroundImage: `url(${props.headerBackgroundImage})` }}
      >
        <Box
          display={'flex'}
          flexDirection={'column'}
          gap={2}
          className="header__content"
        >
          <h1 className="header__title">{props.title}</h1>
          <h2 className="header__subtitle">{props.subtitle}</h2>
        </Box>
      </header>
      <main
        className="main"
        style={{ backgroundColor: props.mainBackground }}
      >
        <div
          className="pinkblob pinkblob--topleft"
          style={{ background: props.blobBackground }}
        />
        <div
          className="pinkblob pinkblob--topright"
          style={{ background: props.blobBackground }}
        />
        <section
          className="leadtext"
          style={{ color: props.leadColor }}
        >
          <p className="leadtext__text">{props.lead}</p>
        </section>
        <section className="wakeuptext">
          <div>{props.wakeup}</div>
        </section>
        <div
          className="pinkblob pinkblob--bottomleft"
          style={{ background: props.blobBackground }}
        />
        <div
          className="pinkblob pinkblob--bottomright"
          style={{ background: props.blobBackground }}
        />
        <section
          className="readytext"
          style={{
            background:
              props.readyBackgroundImage ?
                `url(${props.readyBackgroundImage})`
              : props.readyBackgroundColor,
          }}
        >
          <div>{props.ready}</div>
        </section>
        <section
          className="independenttext"
          style={{
            backgroundImage: `url(${props.independentBackgroundImage})`,
          }}
        >
          <p>{props.independent}</p>
        </section>
        <section
          className="deliverytext"
          style={{ background: props.deliveryBackground }}
        >
          <div>{props.delivery}</div>
        </section>
        <section
          className="subscribetext"
          style={{ background: props.subscribetextBackground }}
        >
          <div>{props.subscribe}</div>
        </section>
      </main>
      <footer
        className="footer"
        style={{ backgroundImage: `url(${props.footerBackgroundImage})` }}
      >
        {props.signupForm}
      </footer>
    </>
  );
}

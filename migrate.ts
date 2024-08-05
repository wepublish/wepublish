import axios from 'axios';
import cheerio from 'cheerio';

interface WordPressPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  date: string;
  slug: string;
}

interface SlateBlock {
  type: string;
  data: any;
}

interface MigratedArticle {
  title: string;
  date: string;
  slug: string;
  content: SlateBlock[];
}

const WP_API_URL = 'https://mannschaft.com/wp-json/wp/v2/posts';
const BATCH_SIZE = 10;

const fetchPosts = async (page: number, perPage: number): Promise<WordPressPost[]> => {
  const response = await axios.get(WP_API_URL, {
    params: {page, per_page: perPage},
  });
  return response.data;
};

const htmlToSlate = (html: string): SlateBlock[] => {
  const $ = cheerio.load(html);
  const blocks: SlateBlock[] = [];

  $('body').contents().each((i, el: any) => {
    // if (el.tagName === 'p') {
    //   blocks.push({
    //     type: 'richText',
    //     data: {html: $(el).html()},
    //   });
    // } else if (el.tagName === 'img') {
    //   blocks.push({
    //     type: 'image',
    //     data: {src: $(el).attr('src'), alt: $(el).attr('alt')},
    //   });
    // } else if (el.tagName === 'blockquote') {
    //   blocks.push({
    //     type: 'quote',
    //     data: {text: $(el).text()},
    //   });
    // } else if (el.tagName === 'h1' || el.tagName === 'h2' || el.tagName === 'h3' || el.tagName === 'h4' || el.tagName === 'h5' || el.tagName === 'h6') {
    //   blocks.push({
    //     type: 'title',
    //     data: {text: $(el).text(), level: el.tagName},
    //   });
    // } else if (el.tagName === 'iframe') {
    //   const src = $(el).attr('src');
    //   if (src.includes('youtube.com') || src.includes('youtu.be')) {
    //     blocks.push({
    //       type: 'youTubeVideo',
    //       data: {src},
    //     });
    //   } else if (src.includes('vimeo.com')) {
    //     blocks.push({
    //       type: 'vimeoVideo',
    //       data: {src},
    //     });
    //   } else {
    //     blocks.push({
    //       type: 'embed',
    //       data: {src},
    //     });
    //   }
    // } else {
    //   blocks.push({
    //     type: 'html',
    //     data: {html: $(el).html()},
    //   });
    // }
  });

  return blocks;
};

const migratePost = (post: WordPressPost): MigratedArticle => {
  const {title, content, date, slug} = post;
  return {
    title: title.rendered,
    date,
    slug,
    content: htmlToSlate(content.rendered),
  };
};

const migratePosts = async () => {
  let page = 1;
  let posts: WordPressPost[] = [];

  while (true) {
    const batch = await fetchPosts(page, BATCH_SIZE);
    if (batch.length === 0) break;

    for (const post of batch) {
      const migratedPost = migratePost(post);
      console.log(migratedPost)
    }

    page += 1;
  }
};

migratePosts().catch((error) => console.error('Migration failed:', error));

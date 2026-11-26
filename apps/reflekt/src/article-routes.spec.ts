vi.mock('@wepublish/utils/website/tanstack', () => ({
  articleBySlugRoute: (articlePageProps: unknown) => ({ articlePageProps }),
  articleByIdRoute: (articlePageProps: unknown) => ({ articlePageProps }),
}));

const withoutRelatedAndComments = {
  articlePageProps: { relatedTitle: null, commentsTitle: null },
};

describe('reflekt article routes', () => {
  it('hide related articles and comments by slug', async () => {
    const { Route } = await import('./routes/a/$slug');

    expect(Route.options).toMatchObject(withoutRelatedAndComments);
  });

  it('hide related articles and comments by id', async () => {
    const { Route } = await import('./routes/a/id/$id');

    expect(Route.options).toMatchObject(withoutRelatedAndComments);
  });
});

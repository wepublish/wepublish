import * as formEditor from './index';

describe('@wepublish/form/editor pickers', () => {
  it('exports the picker fields and maps each picker kind to its field', () => {
    expect(formEditor.components).toMatchObject({
      image: formEditor.ImageField,
      tags: formEditor.TagsField,
      page: formEditor.PageField,
      pages: formEditor.PagesField,
      article: formEditor.ArticleField,
      paywall: formEditor.PaywallField,
      memberPlan: formEditor.MemberPlanField,
      memberPlans: formEditor.MemberPlansField,
      user: formEditor.UserField,
    });
    expect(
      [
        formEditor.ImageField,
        formEditor.TagsField,
        formEditor.PageField,
        formEditor.PagesField,
        formEditor.ArticleField,
        formEditor.PaywallField,
        formEditor.MemberPlanField,
        formEditor.MemberPlansField,
        formEditor.UserField,
      ].every(component => typeof component === 'function')
    ).toBe(true);
  });
});

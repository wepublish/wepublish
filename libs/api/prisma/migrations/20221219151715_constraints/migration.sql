-- DropForeignKey
ALTER TABLE "articles.revisions.author" DROP CONSTRAINT "articles.revisions.author_authorId_fkey";

-- DropForeignKey
ALTER TABLE "articles.revisions.author" DROP CONSTRAINT "articles.revisions.author_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "articles.revisions.social-media-author" DROP CONSTRAINT "articles.revisions.social-media-author_authorId_fkey";

-- DropForeignKey
ALTER TABLE "articles.revisions.social-media-author" DROP CONSTRAINT "articles.revisions.social-media-author_revisionId_fkey";

-- AddForeignKey
ALTER TABLE "articles.revisions.author" ADD CONSTRAINT "articles.revisions.author_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "articles.revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles.revisions.author" ADD CONSTRAINT "articles.revisions.author_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles.revisions.social-media-author" ADD CONSTRAINT "articles.revisions.social-media-author_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "articles.revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles.revisions.social-media-author" ADD CONSTRAINT "articles.revisions.social-media-author_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


--
-- Data for Name: articles.revisions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."articles.revisions" (id, "preTitle", title, lead, "seoTitle", slug, tags, "canonicalUrl", "imageID", "authorIDs", breaking, blocks, "hideAuthor", "socialMediaTitle", "socialMediaDescription", "socialMediaAuthorIDs", "socialMediaImageID", revision, "createdAt", "modifiedAt", "updatedAt", "publishAt", "publishedAt") VALUES ('cl9pgf5ep0401qu2r7tad7z51', NULL, 'new', '', 'new', 'new', '{}', '', NULL, '{}', false, '{"{\"type\": \"title\", \"title\": \"new\"}","{\"type\": \"image\"}"}', false, NULL, NULL, '{}', NULL, 0, '2022-10-26 09:48:28.138', '2022-10-26 09:48:42.091', '2022-10-26 09:48:40.718', NULL, '2022-10-26 09:48:40.718');
INSERT INTO public."articles.revisions" (id, "preTitle", title, lead, "seoTitle", slug, tags, "canonicalUrl", "imageID", "authorIDs", breaking, blocks, "hideAuthor", "socialMediaTitle", "socialMediaDescription", "socialMediaAuthorIDs", "socialMediaImageID", revision, "createdAt", "modifiedAt", "updatedAt", "publishAt", "publishedAt") VALUES ('cl9pgfh730712qu2r5jlyezbo', NULL, 'second', '', 'second', 'second', '{}', '', NULL, '{}', false, '{"{\"type\": \"title\", \"title\": \"second\"}","{\"type\": \"image\"}"}', false, NULL, NULL, '{}', NULL, 0, '2022-10-26 09:48:54.526', '2022-10-26 09:48:57.359', '2022-10-26 09:48:55.593', NULL, '2022-10-26 09:48:55.593');


--
-- Data for Name: articles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.articles (id, "createdAt", "modifiedAt", "publishedId", "pendingId", "draftId", shared) VALUES ('cl9pgeulm0139qu2rsbp1ok9k', '2022-10-26 09:48:28.138', '2022-10-26 09:48:42.147', 'cl9pgf5ep0401qu2r7tad7z51', NULL, NULL, false);
INSERT INTO public.articles (id, "createdAt", "modifiedAt", "publishedId", "pendingId", "draftId", shared) VALUES ('cl9pgfeym0556qu2r0wju9tni', '2022-10-26 09:48:54.526', '2022-10-26 09:48:57.426', 'cl9pgfh730712qu2r5jlyezbo', NULL, NULL, false);


--
-- Data for Name: images; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: authors; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: authors.links; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, "createdAt", "modifiedAt", email, "emailVerifiedAt", name, "firstName", "preferredName", password, active, "lastLogin", "roleIDs") VALUES ('cl9pgee6a0096q32rxko6i6w4', '2022-10-26 09:48:06.85', '2022-10-26 09:48:06.85', 'dev@wepublish.ch', '2022-10-26 09:48:06.75', 'Dev User', NULL, NULL, '$2b$11$Bh3.thzNN7DgzMnSFL/Kr.bESDXoJs6uTdkMHKd9WoOvA/jVJPo.G', true, NULL, '{admin}');
INSERT INTO public.users (id, "createdAt", "modifiedAt", email, "emailVerifiedAt", name, "firstName", "preferredName", password, active, "lastLogin", "roleIDs") VALUES ('cl9pgee950105q32r64d8q842', '2022-10-26 09:48:06.953', '2022-10-26 09:48:06.954', 'editor@wepublish.ch', '2022-10-26 09:48:06.854', 'Editor User', NULL, NULL, '$2b$11$Xdal94nGrDDB8prcBrh/VO0hjx/ubCfZjf76sculDNBeZBeQ/hz9y', true, NULL, '{editor}');


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.comments (id, "createdAt", "modifiedAt", "userID", "itemID", "itemType", "parentID", "rejectionReason", state, "authorType", "guestUsername", "guestUserImageID", source) VALUES ('cl9pgjjw12173qu2rp1d2d1qs', '2022-10-26 09:52:07.537', '2022-10-26 09:52:21.383', 'cl9pgee6a0096q32rxko6i6w4', 'cl9pgfeym0556qu2r0wju9tni', 'article', NULL, NULL, 'approved', 'verifiedUser', NULL, NULL, NULL);
INSERT INTO public.comments (id, "createdAt", "modifiedAt", "userID", "itemID", "itemType", "parentID", "rejectionReason", state, "authorType", "guestUsername", "guestUserImageID", source) VALUES ('cl9pgl82b2665qu2rv9dg8c0g', '2022-10-26 09:53:25.523', '2022-10-26 09:54:14.045', 'cl9pgee6a0096q32rxko6i6w4', 'cl9pgeulm0139qu2rsbp1ok9k', 'article', NULL, NULL, 'approved', 'verifiedUser', NULL, NULL, NULL);
INSERT INTO public.comments (id, "createdAt", "modifiedAt", "userID", "itemID", "itemType", "parentID", "rejectionReason", state, "authorType", "guestUsername", "guestUserImageID", source) VALUES ('cl9pglejb2741qu2rkr498nfj', '2022-10-26 09:53:33.911', '2022-10-26 09:54:18.779', 'cl9pgee6a0096q32rxko6i6w4', 'cl9pgeulm0139qu2rsbp1ok9k', 'article', NULL, NULL, 'approved', 'verifiedUser', NULL, NULL, NULL);
INSERT INTO public.comments (id, "createdAt", "modifiedAt", "userID", "itemID", "itemType", "parentID", "rejectionReason", state, "authorType", "guestUsername", "guestUserImageID", source) VALUES ('cl9pgm0t23070qu2rs7gdu4ca', '2022-10-26 09:54:02.774', '2022-10-26 09:54:23.486', 'cl9pgee6a0096q32rxko6i6w4', 'cl9pgfeym0556qu2r0wju9tni', 'article', NULL, NULL, 'approved', 'verifiedUser', NULL, NULL, NULL);
INSERT INTO public.comments (id, "createdAt", "modifiedAt", "userID", "itemID", "itemType", "parentID", "rejectionReason", state, "authorType", "guestUsername", "guestUserImageID", source) VALUES ('cl9pglcy22703qu2rosv13nn1', '2022-10-26 09:53:31.85', '2022-10-26 09:54:27.592', 'cl9pgee6a0096q32rxko6i6w4', 'cl9pgeulm0139qu2rsbp1ok9k', 'article', NULL, NULL, 'approved', 'verifiedUser', NULL, NULL, NULL);


--
-- Data for Name: comments.rating-system-answers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: comments.ratings; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: comments.revisions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."comments.revisions" (id, "createdAt", text, "commentId", lead, title) VALUES ('cl9pgjjw12174qu2r7c69ghde', '2022-10-26 09:52:07.537', '[{"type": "paragraph", "children": [{"text": "article comment"}]}]', 'cl9pgjjw12173qu2rp1d2d1qs', NULL, NULL);
INSERT INTO public."comments.revisions" (id, "createdAt", text, "commentId", lead, title) VALUES ('cl9pgl82b2666qu2rtgxnitcm', '2022-10-26 09:53:25.523', '[{"type": "paragraph", "children": [{"text": "dsgfdg"}]}]', 'cl9pgl82b2665qu2rv9dg8c0g', NULL, NULL);
INSERT INTO public."comments.revisions" (id, "createdAt", text, "commentId", lead, title) VALUES ('cl9pglcy22704qu2rtuo9nqmq', '2022-10-26 09:53:31.85', '[{"type": "paragraph", "children": [{"text": "ds"}]}]', 'cl9pglcy22703qu2rosv13nn1', NULL, NULL);
INSERT INTO public."comments.revisions" (id, "createdAt", text, "commentId", lead, title) VALUES ('cl9pglejb2742qu2r89ud9xx2', '2022-10-26 09:53:33.911', '[{"type": "paragraph", "children": [{"text": "ds"}]}]', 'cl9pglejb2741qu2rkr498nfj', NULL, NULL);
INSERT INTO public."comments.revisions" (id, "createdAt", text, "commentId", lead, title) VALUES ('cl9pgm0t23071qu2r34154zma', '2022-10-26 09:54:02.774', '[{"type": "paragraph", "children": [{"text": "vxcv"}]}]', 'cl9pgm0t23070qu2rs7gdu4ca', NULL, NULL);


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: comments.tagged-comments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: images.focal-point; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: member.plans; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: payment.methods; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: invoices.items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mail.log; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: member.plans.payment-methods; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: navigations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.navigations (id, "createdAt", "modifiedAt", key, name) VALUES ('cl9pggv9w1405qu2r7ihip2h1', '2022-10-26 09:50:02.324', '2022-10-26 09:50:02.325', '23rt', 'abc');
INSERT INTO public.navigations (id, "createdAt", "modifiedAt", key, name) VALUES ('cl9pghc3w1548qu2rytcr80mx', '2022-10-26 09:50:24.14', '2022-10-26 09:50:24.141', 'fgd', 'newnav');
INSERT INTO public.navigations (id, "createdAt", "modifiedAt", key, name) VALUES ('cl9pghvzd1791qu2rzi1m3r81', '2022-10-26 09:50:49.897', '2022-10-26 09:50:49.898', 'xcyxc', 'dfsd');


--
-- Data for Name: pages.revision; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."pages.revision" (id, revision, "createdAt", "modifiedAt", "updatedAt", "publishedAt", "publishAt", slug, title, description, tags, "imageID", "socialMediaTitle", "socialMediaDescription", "socialMediaImageID", blocks) VALUES ('cl9pggc6q1201qu2re42djckz', 0, '2022-10-26 09:49:34.43', '2022-10-26 09:49:37.533', '2022-10-26 09:49:35.963', '2022-10-26 09:49:35.963', NULL, '', '', '', '{}', NULL, NULL, NULL, NULL, '{"{\"type\": \"title\", \"title\": \"home\"}","{\"type\": \"teaserGridFlex\", \"flexTeasers\": [{\"teaser\": {\"type\": \"article\", \"style\": \"default\", \"articleID\": \"cl9pgfeym0556qu2r0wju9tni\"}, \"alignment\": {\"h\": 6, \"i\": \"cSjmiiCQo37muRpqW4fsg\", \"w\": 3, \"x\": 0, \"y\": 0, \"static\": false}}, {\"teaser\": {\"type\": \"article\", \"style\": \"default\", \"articleID\": \"cl9pgeulm0139qu2rsbp1ok9k\"}, \"alignment\": {\"h\": 3, \"i\": \"1rN8e0nHj206j8Jwjf9gm\", \"w\": 5, \"x\": 3, \"y\": 0, \"static\": false}}, {\"teaser\": null, \"alignment\": {\"h\": 3, \"i\": \"AF0niXJrdBqvkbyU5OAAd\", \"w\": 5, \"x\": 3, \"y\": 3, \"static\": false}}, {\"teaser\": null, \"alignment\": {\"h\": 6, \"i\": \"r6x-TYhB0e1gFhPkVqxpO\", \"w\": 4, \"x\": 8, \"y\": 0, \"static\": false}}]}"}');


--
-- Data for Name: pages; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.pages (id, "createdAt", "modifiedAt", "publishedId", "pendingId", "draftId") VALUES ('cl9pgg9r21032qu2rqzdth0q8', '2022-10-26 09:49:34.43', '2022-10-26 09:49:37.588', 'cl9pggc6q1201qu2re42djckz', NULL, NULL);


--
-- Data for Name: navigations.links; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."navigations.links" (id, "createdAt", "modifiedAt", label, type, url, "pageID", "articleID", "navigationId") VALUES ('cl9pggv9w1406qu2r5gxrwls7', '2022-10-26 09:50:02.324', '2022-10-26 09:50:02.325', 'jkl', 'article', NULL, NULL, 'cl9pgfeym0556qu2r0wju9tni', 'cl9pggv9w1405qu2r7ihip2h1');
INSERT INTO public."navigations.links" (id, "createdAt", "modifiedAt", label, type, url, "pageID", "articleID", "navigationId") VALUES ('cl9pghc3w1549qu2rtlrjpapv', '2022-10-26 09:50:24.14', '2022-10-26 09:50:24.141', 'sdf', 'article', NULL, NULL, 'cl9pgeulm0139qu2rsbp1ok9k', 'cl9pghc3w1548qu2rytcr80mx');
INSERT INTO public."navigations.links" (id, "createdAt", "modifiedAt", label, type, url, "pageID", "articleID", "navigationId") VALUES ('cl9pghvzd1792qu2rewc26om0', '2022-10-26 09:50:49.897', '2022-10-26 09:50:49.898', 'xys', 'article', NULL, NULL, 'cl9pgfeym0556qu2r0wju9tni', 'cl9pghvzd1791qu2rzi1m3r81');


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: peerProfiles; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: peers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: polls; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: polls.answers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: polls.external-vote-sources; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: polls.external-votes; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: polls.votes; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sessions (id, "createdAt", "expiresAt", token, "userID") VALUES ('cl9pgekxr0016qu2rx0lbhx8y', '2022-10-26 09:48:15.615', '2022-11-02 09:48:15.614', 'YtzsnUDCEELPyYju2p4rdaInoydVEJSL', 'cl9pgee6a0096q32rxko6i6w4');
INSERT INTO public.sessions (id, "createdAt", "expiresAt", token, "userID") VALUES ('cl9pgjauj2145qu2r2f84sjm0', '2022-10-26 09:51:55.819', '2022-11-02 09:51:55.818', 'nHNj3d5z7s1hnGeRiItLzAK5ea3jcqde', 'cl9pgee6a0096q32rxko6i6w4');


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.settings (id, "createdAt", "modifiedAt", name, value, "settingRestriction") VALUES ('cl9pgee2y0000q32rdounmjdv', '2022-10-26 09:48:06.73', '2022-10-26 09:48:06.731', 'peeringTimeoutInMs', '3000', '{"maxValue": 10000, "minValue": 1000}');
INSERT INTO public.settings (id, "createdAt", "modifiedAt", name, value, "settingRestriction") VALUES ('cl9pgee2y0002q32r67hnk2a6', '2022-10-26 09:48:06.73', '2022-10-26 09:48:06.731', 'allowGuestCommenting', 'false', '{"allowedValues": {"boolChoice": true}}');
INSERT INTO public.settings (id, "createdAt", "modifiedAt", name, value, "settingRestriction") VALUES ('cl9pgee2y0004q32rxlim89vq', '2022-10-26 09:48:06.73', '2022-10-26 09:48:06.731', 'allowGuestCommentRating', 'false', '{"allowedValues": {"boolChoice": true}}');
INSERT INTO public.settings (id, "createdAt", "modifiedAt", name, value, "settingRestriction") VALUES ('cl9pgee2y0006q32rsdgjo0ff', '2022-10-26 09:48:06.73', '2022-10-26 09:48:06.731', 'allowGuestPollVoting', 'false', '{"allowedValues": {"boolChoice": true}}');
INSERT INTO public.settings (id, "createdAt", "modifiedAt", name, value, "settingRestriction") VALUES ('cl9pgee2y0008q32r0pd5o7kd', '2022-10-26 09:48:06.73', '2022-10-26 09:48:06.731', 'sendLoginJwtExpiresMin', '10080', '{"maxValue": 10080, "minValue": 1}');
INSERT INTO public.settings (id, "createdAt", "modifiedAt", name, value, "settingRestriction") VALUES ('cl9pgee2y0010q32ru1exo3g2', '2022-10-26 09:48:06.73', '2022-10-26 09:48:06.731', 'resetPasswordJwtExpiresMin', '1440', '{"maxValue": 10080, "minValue": 1}');
INSERT INTO public.settings (id, "createdAt", "modifiedAt", name, value, "settingRestriction") VALUES ('cl9pgee2y0012q32rzx10gg60', '2022-10-26 09:48:06.73', '2022-10-26 09:48:06.731', 'invoiceFreqReminder', '3', '{"maxValue": 30, "minValue": 0}');
INSERT INTO public.settings (id, "createdAt", "modifiedAt", name, value, "settingRestriction") VALUES ('cl9pgee2y0014q32ru6oybbwc', '2022-10-26 09:48:06.73', '2022-10-26 09:48:06.731', 'invoiceReminderMaxTries', '5', '{"maxValue": 10, "minValue": 0}');


--
-- Data for Name: subscriptions.deactivation-reasons; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: subscriptions.periods; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: tokens; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: users.addresses; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: users.oauth2-accounts; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: users.payment-providers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: users.roles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."users.roles" (id, "createdAt", "modifiedAt", description, name, "permissionIDs", "systemRole") VALUES ('admin', '2022-10-26 09:48:06.73', '2022-10-26 09:48:06.73', 'Administrator Role', 'Admin', '{}', true);
INSERT INTO public."users.roles" (id, "createdAt", "modifiedAt", description, name, "permissionIDs", "systemRole") VALUES ('editor', '2022-10-26 09:48:06.73', '2022-10-26 09:48:06.73', 'Editor Role', 'Editor', '{}', true);
INSERT INTO public."users.roles" (id, "createdAt", "modifiedAt", description, name, "permissionIDs", "systemRole") VALUES ('peer', '2022-10-26 09:48:06.73', '2022-10-26 09:48:06.73', 'Peer Role', 'Peer', '{}', true);


--
-- PostgreSQL database dump complete
--










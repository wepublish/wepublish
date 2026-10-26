Feature: Smoke
  The site is reachable and exposes the basics search engines rely on.

  @smoke
  Scenario: Homepage renders
    Given I open the homepage
    Then the page has a title

  @smoke
  Scenario: Sitemap is available
    When I request "/api/sitemap"
    Then the response status is 200

  @seo
  Scenario: Homepage has a meta description
    Given I open the homepage
    Then the page has a meta description

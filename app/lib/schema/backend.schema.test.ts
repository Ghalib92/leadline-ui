import { describe, expect, it } from 'vitest';
import agents from './__fixtures__/backend/agents.json';
import runDetail from './__fixtures__/backend/run_detail.json';
import runs from './__fixtures__/backend/runs.json';
import opportunities from './__fixtures__/backend/opportunities.json';
import opportunity from './__fixtures__/backend/opportunity.json';
import clientLead from './__fixtures__/backend/client_lead.json';
import overview from './__fixtures__/backend/overview.json';
import reasons from './__fixtures__/backend/reasons.json';
import review from './__fixtures__/backend/review.json';
import reviews from './__fixtures__/backend/reviews.json';
import insights from './__fixtures__/backend/insights.json';
import proposal from './__fixtures__/backend/proposal.json';
import bid from './__fixtures__/backend/bid.json';
import proposalEvents from './__fixtures__/backend/proposal_events.json';
import versions from './__fixtures__/backend/versions.json';
import contacts from './__fixtures__/backend/contacts.json';
import contactSearch from './__fixtures__/backend/contact_search.json';
import emails from './__fixtures__/backend/emails.json';
import purposes from './__fixtures__/backend/purposes.json';
import deadlines from './__fixtures__/backend/deadlines.json';
import reminders from './__fixtures__/backend/reminders.json';
import runSettings from './__fixtures__/backend/run_settings.json';
import {
  agentDtoSchema,
  choiceSchema,
  contactDtoSchema,
  contactSearchDtoSchema,
  deadlineDtoSchema,
  drfPage,
  insightsDtoSchema,
  opportunityDtoSchema,
  outreachEmailDtoSchema,
  overviewDtoSchema,
  proposalDtoSchema,
  proposalEventsDtoSchema,
  reminderPreferenceSchema,
  reviewDtoSchema,
  reviewResultDtoSchema,
  runDetailDtoSchema,
  runListItemDtoSchema,
  toAgentBody,
  toOpportunityQuery,
  runSettingsDtoSchema,
  toRunSettingsForm,
  versionSummarySchema,
} from '~/lib/schema';

/**
 * Real responses from leadline_backend (captured with the fake runner and fake
 * Proposal Writer), parsed with the schemas the screens use. Re-capture them
 * when the backend contract changes.
 */
describe('backend contract', () => {
  it('maps agents onto the feed types', () => {
    const [agent] = agentDtoSchema.array().parse(agents);
    expect(agent.goal).toBe('grants');
    expect(agent.opportunityTypes).toEqual(['grant']);
    expect(agent.canManage).toBe(true);
    expect(toAgentBody({ opportunityTypes: ['tender'] })).toEqual({
      opportunity_types: ['tender', 'rfp', 'consultancy'],
    });
  });

  it('reads what an agent adds and the merged scope it searches', () => {
    const [agent] = agentDtoSchema.array().parse(agents);
    expect(agent.depth).toBe('');
    expect(agent.folders).toEqual([
      { id: 'qdWPq2z3bYTt', name: 'Past proposals' },
    ]);
    expect(agent.links[0]).toMatchObject({ label: 'Partner calls' });
    const scope = agent.effective!;
    expect(scope.depth).toEqual({ value: 'standard', origin: 'organization' });
    // `fellowship` is a grant in the feed, which the organization already has.
    expect(scope.opportunityTypes).toEqual([
      { value: 'grant', origin: 'organization' },
    ]);
    expect(scope.folders.map((f) => [f.name, f.origin])).toEqual([
      ['Financials', 'organization'],
      ['Past proposals', 'agent'],
    ]);
  });

  it('parses runs with steps, events and candidates', () => {
    const run = runDetailDtoSchema.parse(runDetail);
    expect(run.steps.map((s) => s.key)).toEqual([
      'profile',
      'search',
      'read',
      'match',
      'save',
    ]);
    expect(run.candidates.length).toBeGreaterThan(0);
    expect(run.usage).toBeDefined();
    const page = drfPage(runListItemDtoSchema).parse(runs);
    expect(page.results[0].id).toBe(run.id);
  });

  it('drops run steps and step statuses it does not know', () => {
    const run = runDetailDtoSchema.parse({
      ...runDetail,
      steps: [
        { ...runDetail.steps[0], status: 'paused' },
        { ...runDetail.steps[1], key: 'analyse' },
      ],
    });
    expect(run.steps).toHaveLength(1);
    expect(run.steps[0]).toMatchObject({ key: 'profile', status: 'pending' });
  });

  it('parses opportunities, overview and reviews', () => {
    const page = drfPage(opportunityDtoSchema).parse(opportunities);
    expect(page.count).toBeGreaterThan(0);
    const opp = opportunityDtoSchema.parse(opportunity);
    expect(opp.latestReview).toBeNull();
    expect(opp.kind).toBe('rfp');
    expect(opp.type).toBe('tender');
    expect(opp.briefStatus).toBe('ready');
    expect(opp.brief?.eligibility[1]).toMatchObject({ meets: false });
    expect(opp.brief?.nextStep).toMatch(/^Confirm the audit gap/);
    overviewDtoSchema.parse(overview);
    choiceSchema.array().parse(reasons);
    const result = reviewResultDtoSchema.parse(review);
    expect(result.opportunity.status).toBe('pursuing');
    expect(result.opportunity.latestReview?.decision).toBe('approve');
    expect(reviewDtoSchema.array().parse(reviews)).toHaveLength(1);
    insightsDtoSchema.parse(insights);
  });

  it('parses proposals, events and versions', () => {
    const parsed = proposalDtoSchema.parse(proposal);
    expect(parsed.status).toBe('ready');
    expect(parsed.sections.length).toBeGreaterThan(0);
    expect(parsed.review?.score).toBeTypeOf('number');
    proposalEventsDtoSchema.parse(proposalEvents);
    expect(versionSummarySchema.array().parse(versions)[0].number).toBe(1);
  });

  it('parses a bid: its checklist and deadline plan', () => {
    const parsed = proposalDtoSchema.parse(bid);
    expect(parsed.isTender).toBe(true);
    expect(parsed.requirements?.pass_mark).toBe('60/80');
    expect(parsed.requirements?.key_dates?.[0].kind).toBe('clarification');
    expect(parsed.checklist).toHaveLength(12);
    expect(parsed.checklist[0]).toMatchObject({
      key: 'r1',
      status: 'check',
      done: false,
      doneAt: null,
    });
    expect(parsed.checklist[0].documents[0].title).toMatch(/Incorporation/);
    expect(parsed.checklist[2].done).toBe(true);
    expect(parsed.bidPlan?.daysLeft).toBe(8);
    expect(parsed.bidPlan?.steps.at(-1)).toMatchObject({
      key: 'closing',
      time: '10:00',
      fromTender: true,
    });
    // A plain proposal is not a bid.
    const plain = proposalDtoSchema.parse(proposal);
    expect(plain.isTender).toBe(false);
    expect(plain.checklist).toEqual([]);
    expect(plain.bidPlan).toBeNull();
  });

  it('parses contacts, outreach and deadlines', () => {
    expect(contactDtoSchema.array().parse(contacts)[0].canEmail).toBe(true);
    expect(contactSearchDtoSchema.parse(contactSearch).status).toBe('done');
    const queue = drfPage(outreachEmailDtoSchema).parse(emails);
    expect(queue.results[0].status).toBe('draft');
    choiceSchema.array().parse(purposes);
    expect(deadlineDtoSchema.array().parse(deadlines)[0].daysLeft).toBe(10);
    expect(reminderPreferenceSchema.parse(reminders).daysBefore).toEqual([
      14, 3, 1,
    ]);
  });

  it('turns feed filters into backend query parameters', () => {
    expect(
      toOpportunityQuery({
        page: 2,
        limit: 25,
        type: 'event',
        agentId: 'a1',
        run: 'run-123',
        q: 'youth',
        saved: 'true',
        review: 'pending',
        sort: ['matchScore:desc'],
      }).query
    ).toEqual({
      page: 2,
      page_size: 25,
      type: ['conference', 'award', 'competition'],
      agent: 'a1',
      run: 'run-123',
      search: 'youth',
      saved: 'true',
      review: 'pending',
      sort: '-match_score',
    });
  });

  it('lists the best matches first by default', () => {
    expect(toOpportunityQuery({}).query.sort).toBe('-match_score');
    expect(toOpportunityQuery({ sort: 'foundAt:desc' }).query.sort).toBe(
      '-found_at'
    );
  });

  it('prefills "Configure this search" from the search settings', () => {
    const settings = runSettingsDtoSchema.parse(runSettings);
    expect(toRunSettingsForm(settings)).toEqual({
      depth: 'quick',
      sources: ['web', 'grants'],
      opportunityTypes: ['grant'],
      knowledgeMode: 'selected',
      folders: ['qdWPq2z3bYTt'],
    });
  });

  it('lists every goal with the feed types and sources it searches', () => {
    const { goals } = runSettingsDtoSchema.parse(runSettings);
    expect(goals.map((g) => [g.value, g.available])).toEqual([
      ['clients', true],
      ['tenders', true],
      ['grants', true],
    ]);
    expect(goals[0].opportunityTypes).toEqual(['client']);
    expect(goals[0].sources).toEqual(['businesses']);
    const [, tenders, grants] = goals;
    // rfp and consultancy are tenders in the feed; every grant kind folds into
    // grants, partnerships and events.
    expect(tenders.opportunityTypes).toEqual(['tender']);
    expect(tenders.sources).toEqual(['web', 'procurement', 'news']);
    expect(grants.opportunityTypes).toEqual(['grant', 'partnership', 'event']);
  });

  it('reads a client lead with its business listing', () => {
    const lead = opportunityDtoSchema.parse(clientLead);
    expect(lead.type).toBe('client');
    expect(lead.briefStatus).toBe('none');
    expect(lead.business).toMatchObject({
      category: 'Hotel',
      phone: '+254 700 000001',
      website: '',
      completeListing: true,
      signals: ['no_website', 'many_reviews'],
      sourceLabel: 'Google Maps',
      listingUrl: 'https://www.google.com/maps/place/savannah-lodge',
    });
    expect(lead.business?.socials).toEqual({
      instagram: 'https://www.instagram.com/savannahlodge',
    });
    expect(lead.business?.websiteStatus).toBe('none');
    expect(lead.business?.evidence[0]).toEqual({
      signal: 'no_website',
      detail: 'Google Maps lists no website for it.',
    });
    expect(lead.business?.foundOn).toEqual({ instagram: 'web search' });
    expect(lead.business?.site).toBeUndefined();
    // Opportunities found before leads existed have no business.
    expect(opportunityDtoSchema.parse(opportunity).business).toBeUndefined();
  });

  it("reads a lead's website check", () => {
    const lead = opportunityDtoSchema.parse({
      ...clientLead,
      business: {
        ...clientLead.business,
        website: 'https://kilima.co.ke/',
        website_status: 'found',
        site: {
          url: 'https://kilima.co.ke/',
          https: false,
          mobile_ready: false,
          copyright_year: 2017,
          booking: null,
          stale: true,
          checked_at: '2026-11-17',
        },
      },
    });
    expect(lead.business?.site).toMatchObject({
      url: 'https://kilima.co.ke/',
      reachable: true,
      blocked: false,
      https: false,
      mobileReady: false,
      copyrightYear: 2017,
      booking: undefined,
      certificateError: false,
      checkedAt: '2026-11-17',
    });
  });

  it('derives the website status of leads saved before the lookup', () => {
    const { website_status: _, evidence: __, ...listing } = clientLead.business;
    const parse = (business: object) =>
      opportunityDtoSchema.parse({ ...clientLead, business }).business;
    expect(parse(listing)?.websiteStatus).toBe('none');
    expect(parse({ ...listing, complete_listing: false })?.websiteStatus).toBe(
      'unknown'
    );
    expect(
      parse({ ...listing, website: 'https://savannah.co.ke' })?.websiteStatus
    ).toBe('listed');
    expect(parse(listing)?.evidence).toEqual([]);
  });

  it("sends a worker's goal", () => {
    expect(toAgentBody({ goal: 'tenders' })).toEqual({ goal: 'tenders' });
  });

  it('maps the run outcome', () => {
    const run = runDetailDtoSchema.parse(runDetail);
    expect(run.outcome).toEqual({
      added: 3,
      duplicates: 2,
      belowThreshold: 1,
      skipped: {
        closed: 1,
        notAnOpportunity: 0,
        wrongType: 0,
        excluded: 0,
        unreadable: 0,
      },
      bestScore: 95,
      matchThreshold: 55,
    });
    const { outcome: _omitted, ...older } = runDetail;
    expect(runDetailDtoSchema.parse(older).outcome).toBeUndefined();
  });
});

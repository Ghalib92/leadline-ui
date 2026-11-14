import { describe, expect, it } from 'vitest';
import clientBrief from './__fixtures__/backend/client_brief.json';
import tenderBrief from './__fixtures__/backend/tender_brief.json';
import {
  clientBriefDtoSchema,
  clientBriefFormSchema,
  tenderBriefDtoSchema,
  tenderBriefFormSchema,
  toClientBriefWrite,
  toTenderBriefWrite,
} from './brief.schema';

describe('clients brief', () => {
  it('reads what the organization sells and who to', () => {
    const brief = clientBriefDtoSchema.parse(clientBrief);
    expect(brief.services[0]).toEqual({
      name: 'Business websites',
      description: '5 pages, mobile-friendly, WhatsApp button',
      price: 'From KES 40,000',
    });
    expect(brief.customerTypes).toEqual(['hospitality', 'health']);
    expect(brief.signals).toEqual(['no_website', 'no_online_booking']);
  });

  it('round-trips through the form into a snake_case body', () => {
    const brief = clientBriefDtoSchema.parse(clientBrief);
    const form = clientBriefFormSchema.parse(brief);
    const body = toClientBriefWrite(form);
    expect(body).toMatchObject({
      customer_types: ['hospitality', 'health'],
      target_cities: ['Nairobi', 'Mombasa'],
      excluded_keywords: ['franchise'],
    });
    expect(body).not.toHaveProperty('customerTypes');
  });

  it('needs a name for every service and known vocabularies', () => {
    expect(
      clientBriefFormSchema.safeParse({
        services: [{ name: ' ', description: '', price: '' }],
      }).success
    ).toBe(false);
    expect(
      clientBriefFormSchema.safeParse({ signals: ['vibes'] }).success
    ).toBe(false);
  });
});

describe('tenders brief', () => {
  it('reads amounts as numbers and renames fields for the form', () => {
    const brief = tenderBriefDtoSchema.parse(tenderBrief);
    expect(brief).toMatchObject({
      tenderCategories: ['software', 'it_services'],
      tenderEligibility: ['agpo_youth'],
      minValue: 500000,
      maxValue: 20000000,
      currency: 'KES',
    });
  });

  it('sends the backend names and an upper-case currency', () => {
    expect(
      toTenderBriefWrite({
        tenderCategories: ['software'],
        tenderEligibility: ['agpo_women'],
        currency: 'kes',
        minValue: null,
      })
    ).toEqual({
      categories: ['software'],
      eligibility: ['agpo_women'],
      currency: 'KES',
      min_value: null,
    });
  });

  it('checks the contract range', () => {
    const res = tenderBriefFormSchema.safeParse({ minValue: 10, maxValue: 5 });
    expect(res.error?.issues[0].path).toEqual(['maxValue']);
    expect(
      tenderBriefFormSchema.safeParse({ minValue: '', maxValue: 5 }).success
    ).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import pitch from './__fixtures__/backend/lead_pitch.json';
import activity from './__fixtures__/backend/lead_activity.json';
import callList from './__fixtures__/backend/call_list.json';
import {
  callListItemDtoSchema,
  drfPage,
  leadActivityDtoSchema,
  logActivityFormSchema,
  mailtoLink,
  pitchDtoSchema,
  toActivityBody,
  toPitchBody,
  whatsappLink,
} from '~/lib/schema';

describe('lead schemas', () => {
  it('reads a pitch', () => {
    const parsed = pitchDtoSchema.parse(pitch);
    expect(parsed.status).toBe('ready');
    expect(parsed.callPoints).toHaveLength(3);
    expect(parsed.whatsappNumber).toBe('254700000001');
    expect(parsed.editedBy).toBeNull();
  });

  it('reads calls and messages, keeping unknown values readable', () => {
    const [latest, first] = leadActivityDtoSchema.array().parse(activity);
    expect(latest).toMatchObject({
      channel: 'whatsapp',
      outcome: 'call_back',
      followUpOn: '2026-11-20',
      actor: { name: 'Mohaa' },
    });
    expect(first.actor).toBeNull();
    const odd = leadActivityDtoSchema.parse({
      ...activity[0],
      channel: 'fax',
      outcome: 'maybe',
    });
    expect([odd.channel, odd.outcome]).toEqual(['other', 'talked']);
  });

  it('reads the call list', () => {
    const page = drfPage(callListItemDtoSchema).parse(callList);
    const [savannah, hibiscus] = page.results;
    expect(savannah.pitch?.emailSubject).toBe(
      'Online booking for Savannah Lodge'
    );
    expect(savannah.lastOutcome).toBe('call_back');
    expect(hibiscus.pitch).toBeNull();
    expect(hibiscus.lastOutcome).toBeNull();
    expect(hibiscus.lastNote).toBe('');
  });

  it('sends edits and logs in the backend shape', () => {
    expect(
      toPitchBody({
        whatsapp: 'Hi',
        emailSubject: 'S',
        emailBody: 'B',
        callPoints: ' Open \n\nAsk\nClose\nThanks\nExtra',
      })
    ).toEqual({
      whatsapp: 'Hi',
      email_subject: 'S',
      email_body: 'B',
      call_points: ['Open', 'Ask', 'Close', 'Thanks'],
    });
    expect(
      toActivityBody({
        channel: 'call',
        outcome: 'no_answer',
        note: '',
        followUpOn: '',
      })
    ).toEqual({
      channel: 'call',
      outcome: 'no_answer',
      note: '',
      follow_up_on: null,
    });
  });

  it('refuses a follow-up on a closed lead', () => {
    const result = logActivityFormSchema.safeParse({
      channel: 'call',
      outcome: 'not_interested',
      note: '',
      followUpOn: '2026-12-01',
    });
    expect(result.success).toBe(false);
  });
});

describe('links to the person’s own apps', () => {
  it('fills in the WhatsApp message', () => {
    expect(whatsappLink('254700000001', 'Hi there & welcome')).toBe(
      'https://wa.me/254700000001?text=Hi%20there%20%26%20welcome'
    );
    expect(whatsappLink('254700000001')).toBe('https://wa.me/254700000001');
    expect(whatsappLink('')).toBeNull();
    expect(whatsappLink('+254 700')).toBeNull();
  });

  it('fills in the email, with spaces and pluses kept apart', () => {
    expect(mailtoLink('a@b.ke', 'Hi there', 'Call +254 700\nThanks')).toBe(
      'mailto:a@b.ke?subject=Hi%20there&body=Call%20%2B254%20700%0AThanks'
    );
    expect(mailtoLink('')).toBeNull();
  });
});

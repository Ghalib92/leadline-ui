import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { Form } from '~/components/ui/form';
import { OrgFields } from './org-profile-fields';

function Harness({ names }: Readonly<{ names: string[] }>) {
  const form = useForm({
    defaultValues: { minFundingAmount: null, yearFounded: null },
  });
  return (
    <Form {...form}>
      <form>
        <OrgFields names={names} />
      </form>
    </Form>
  );
}

describe('OrgFields number inputs', () => {
  it('never let the browser block odd amounts, and carry autocomplete', () => {
    const { container } = render(
      <Harness
        names={['minFundingAmount', 'maxFundingAmount', 'yearFounded']}
      />
    );
    const inputs = [...container.querySelectorAll('input[type=number]')];
    expect(inputs).toHaveLength(3);
    for (const input of inputs) {
      expect(['any', null]).toContain(input.getAttribute('step'));
      expect(input.getAttribute('autocomplete')).toBe('off');
    }
  });
});

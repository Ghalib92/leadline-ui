import { redirect } from 'react-router';
import type { Route } from './+types/o.$slug.settings.members';

export const loader = ({ params }: Route.LoaderArgs) => {
  return redirect(`/o/${params.slug}/team`);
};

export default function SettingsMembersRedirect() {
  return null;
}

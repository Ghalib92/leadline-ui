import { useParams } from 'react-router';

/** Build links inside the current org: `path('/agents')` → `/o/<slug>/agents`. */
export function useOrgPath() {
  const { slug } = useParams();
  return (sub = '') => `/o/${slug}${sub}`;
}

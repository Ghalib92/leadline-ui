/**
 * Composed, slot-based building blocks. Import these instead of assembling
 * shadcn primitives (Card*, Sheet*, Dialog*, DropdownMenu*, Tabs*) per page.
 */
export { AppCard } from './app-card';
export { AppSheet } from './app-sheet';
export { AppDialog } from './app-dialog';
export { AppDropdown, type AppDropdownItem } from './app-dropdown';
export { AppTabs, type AppTab } from './app-tabs';
export { useConfirm } from '~/components/ui/confirm-dialog';

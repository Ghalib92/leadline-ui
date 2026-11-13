import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import tableFiltersReducer from './slices/table-filters-slice';
import modalReducer from './slices/modal-slice';

/**
 * UI state only. Auth is not in Redux: the session lives in an httpOnly cookie
 * read by server middleware (`lib/auth/middleware.server.ts`).
 */
const rootReducer = combineReducers({
  tableFilters: tableFiltersReducer,
  modals: modalReducer,
});

export const store = configureStore({ reducer: rootReducer });

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

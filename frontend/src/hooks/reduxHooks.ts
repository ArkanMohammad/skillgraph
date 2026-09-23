import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import type { RootState, AppDispatch } from '../store/store'

// Typed version of useDispatch for dispatching Redux actions
export const useAppDispatch = () => useDispatch<AppDispatch>()

// Typed version of useSelector for reading data from the Redux store
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
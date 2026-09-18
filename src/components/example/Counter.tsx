'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { increment, decrement } from '@/redux/features/CounterSlice';
import Button from '../ui/button/Button';

const Counter = () => {
  const count = useSelector((state: RootState) => state.counter.value);
  const dispatch = useDispatch();

  
  return (
    <div>
      <h2>Counter</h2>
      <div>
        <Button onClick={() => dispatch(increment())}>Increment</Button>
        <span>{count}</span>
        <Button onClick={() => dispatch(decrement())}>Decrement</Button>
      </div>
    </div>
  );
};

export default Counter;

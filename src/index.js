import { useMemo, useRef, useEffect } from 'react'
import { Subject } from 'rxjs';

/**
 * useReactor hook
 *
 * @param {callback} reaction Must return an instance of Subject
 * @param {callback} dispatch Will be called
 * @param {array} inputs
 */
export default function useReactor(reaction, dispatch, inputs = []) {
  const { current: subject } = useRef(useMemo(() => reaction(new Subject()), []));

  useEffect(() => {
      const sub = subject.subscribe(dispatch);

      return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
      inputs.map(input => subject.next(input));
  }, inputs);

  return subject;
}

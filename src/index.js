import { useRef, useEffect } from 'react';
import { Subject } from 'rxjs';

/**
 * useReactor hook
 *
 * @param {callback} reaction Must return an instance of Subject
 * @param {callback} dispatch Will be called with the result of the reactor.
 * @param {array} inputs items that will be emitted to the reactor when any of them change.
 */
export default function useReactor(reaction, dispatch, inputs = []) {
  const subjectRef = useRef();

  if (!subjectRef.current) {
    subjectRef.current = reaction(new Subject());
  }

  const { current: subject } = subjectRef;

  useEffect(() => {
    const sub = subject.subscribe(dispatch);

    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    inputs.map(input => subject.next(input));
  }, inputs);

  return subject;
}

import { useRef, useEffect } from 'react';
import { Subject } from 'rxjs';

/**
 * useReactor hook
 *
 * @param {callback} reaction Must return an instance of Subject
 * @param {callback} dispatch Will be called with the result of the reactor.
 * @param {any} input Item or an array of items that will be emitted to the reactor when any of them change.
 *                    The item or items will be compared shallowly to determine if a new emit should take place.
 */
export default function useReactor(reaction, dispatch, input) {
  const subjectRef = useRef();

  if (!subjectRef.current) {
    subjectRef.current = reaction(new Subject());
  }

  const { current: subject } = subjectRef;

  useEffect(() => {
    const sub = subject.subscribe(dispatch);

    return () => sub.unsubscribe();
  }, [
    dispatch,
  ]);

  let inputs = [];
  if (typeof input !== 'undefined') {
    inputs = Array.isArray(input) ? input : [input];
  }

  useEffect(() => {
    if (typeof input !== 'undefined') {
      subject.next(input);
    }
  }, inputs);

  return subject;
}

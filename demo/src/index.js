import React, { useReducer } from 'react';
import { render } from 'react-dom'; // eslint-disable-line import/no-extraneous-dependencies
import {
  of,
  merge,
  forkJoin,
} from 'rxjs';
import {
  switchMap,
  flatMap,
  distinctUntilChanged,
  catchError,
  debounceTime,
  map,
  filter,
} from 'rxjs/operators';
import { ajax } from 'rxjs/ajax';
import useReactor from '../../src';

const initialState = {
  search: '',
  results: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'CHANGE':
      return {
        ...state,
        [action.name]: action.value,
      };
    case 'RESULTS':
      return {
        ...state,
        results: action.results || [],
      };
    default:
      throw new Error('Unkown Action');
  }
}

function searchReactor(value$) {
  const id = 'P5693';

  return value$.pipe(
    filter(v => !!v),
    distinctUntilChanged((z, y) => z === y),
    debounceTime(250),
    switchMap((value) => {
      const url = new URL('https://www.wikidata.org/w/api.php');
      url.searchParams.set('action', 'query');
      url.searchParams.set('format', 'json');
      url.searchParams.set('list', 'search');
      url.searchParams.set('formatversion', 2);
      url.searchParams.set('srinfo', '');
      url.searchParams.set('srprop', '');
      url.searchParams.set('srenablerewrites', 1);
      url.searchParams.set('origin', '*');
      url.searchParams.set('srsearch', `${id} ${value}`);

      return merge(
        of({
          type: 'RESULTS',
          results: [],
        }),
        ajax.getJSON(url.toString()).pipe(
          flatMap((data) => {
            if (!data.query) {
              return of({
                type: 'RESULTS',
                results: [],
              });
            }

            if (!data.query.search || data.query.search.length === 0) {
              return of({
                type: 'RESULTS',
                results: [],
              });
            }

            // Labels.
            const labelUrl = new URL('https://www.wikidata.org/w/api.php');
            labelUrl.searchParams.set('action', 'wbgetentities');
            labelUrl.searchParams.set('format', 'json');
            labelUrl.searchParams.set('origin', '*');
            labelUrl.searchParams.set('formatversion', 2);
            labelUrl.searchParams.set('ids', data.query.search.map(({ title }) => title).join('|'));
            labelUrl.searchParams.set('languages', 'en');

            const entityLabels = ajax.getJSON(labelUrl.toString());

            const entityClaims = forkJoin(data.query.search.map(({ title }) => {
              const claimUrl = new URL('https://www.wikidata.org/w/api.php');
              claimUrl.searchParams.set('action', 'wbgetclaims');
              claimUrl.searchParams.set('format', 'json');
              claimUrl.searchParams.set('origin', '*');
              claimUrl.searchParams.set('formatversion', 2);
              claimUrl.searchParams.set('entity', title);
              claimUrl.searchParams.set('property', id);
              claimUrl.searchParams.set('props', '');

              return forkJoin([of(title), ajax.getJSON(claimUrl.toString())]);
            }));

            return forkJoin([entityLabels, entityClaims]).pipe(
              map(([labels, claimCollection]) => {
                const result = claimCollection.reduce((acc, [entityId, claimSet]) => {
                  if (
                    !claimSet
                    || !claimSet.claims
                    || !claimSet.claims[id]
                  ) {
                    return acc;
                  }

                  // Remove deprecated and sort by prefered.
                  const claims = claimSet.claims[id].filter(c => c.type !== 'deprecated').sort((a, b) => {
                    if (a.rank === 'preferred') {
                      return 1;
                    }

                    if (b.rank === 'preferred') {
                      return -1;
                    }

                    return 0;
                  });

                  if (claims.length === 0) {
                    return acc;
                  }

                  const claimValue = claims.pop().mainsnak.datavalue.value.toUpperCase();

                  let label;
                  if (
                    labels
                    && labels.entities
                    && labels.entities[entityId]
                    && labels.entities[entityId].labels
                    && labels.entities[entityId].labels.en
                    && labels.entities[entityId].labels.en.value
                  ) {
                    label = labels.entities[entityId].labels.en.value;
                  } else {
                    label = claimValue;
                  }

                  return [
                    ...acc,
                    {
                      label,
                      value: claimValue,
                    },
                  ];
                }, []);

                return {
                  type: 'RESULTS',
                  results: result,
                };
              }),
            );
          }),
          catchError(() => (
            of({
              type: 'RESULTS',
              results: [],
            })
          )),
        ),
      );
    }),
  );
}

function Demo() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleChange = ({ target }) => {
    const { name, value } = target;
    dispatch({ type: 'CHANGE', name, value });
  };

  useReactor(searchReactor, dispatch, state.search);

  return (
    <div>
      <h1>Reactor</h1>
      <label htmlFor="search">Search</label>
      <input type="text" name="search" id="search" value={state.search} onChange={handleChange} />
      <ul>
        {state.results.map(({ value, label }) => (
          <li key={value}><a href={`https://www.fandango.com/redirect.aspx?searchby=moverview&mid=${value}`}>{label}</a></li>
        ))}
      </ul>
    </div>
  );
}

render(<Demo />, document.querySelector('#demo'));

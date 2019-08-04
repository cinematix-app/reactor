# useReactor
A React Hook for using RxJS with React.

## Usage
```javascript
useReactor((value$) => (
    value$.pipe(
        // Whatever you want to do, but the end result will be passed to the dispatch callback.
    )
), dispatch, [state.someValueToWatch]);
```

## Example
```javascript
import { useReducer } from 'react';
import useReactor from '@cinematix/reactor';

const initialState = {
    search: '',
};

function reducer(state, action) {
    switch (action.type) {
        case 'CHANGE':
            return {
                ...state,
                [action.name]: action.value
            };
        case 'RESULTS'
            return {
                ...state,
                results: action.results,
            };
        default:
            throw Error('Unkown Action');
    }
}

function AwesomeSearch() {
    const [state, dispatch] = useReducer(reducer, initialState);

    const handleChange = ({ target }) => {
        const { name, value }
        dispatch({ action: 'CHANGE', name, value, });
    };

    useReactor((value$) => (
        value$.pipe(
            // Whatever you want to do, but the end result will be passed to the dispatch callback.
        )
    ), dispatch, [state.search]);

    return (
        <div>
            <label htmlFor="search">Search</label>
            <input type="text" name="search" id="search" value={state.search} onChange={handleChange} />
            <ul>
                {state.results.map(({ value, label }) => (
                    <li key={value}>{label}</li>
                ))}
            </ul>
        </div>
    );
}
```

## API
```javascript
useReactor(
    reaction: (value$: Subject) => Subject,
    dispatch: (value: any) => void,
    inputs: Array<any> = []
): Subject
```
* `reaction` is a function that returns an instance of `Subject`
* `dispatch` is a function that is called with the result of the reactor. It is the callback to `Subject.subscribe()`. It is best to end the observable sequence with action objects, but anything can be returned.
* `inputs` is an array of data to emit when **any** of the items in the array have changed. Each item will be emitted seperately. This is best to be a single item, but can be anything and is optional.

The `Subject` that is returned can be used to emit values manually:
```javascript
const { next } = useReactor(value$ => value$, value => console.log(value));
next('hello!');
// hello!
```

Since the `reactor` only needs an instance of `Subject` a different subject can be returned:
```javascript
useReactor(() => new BehavoirSubject('hello!'), value => console.log(value));
// hello!
```

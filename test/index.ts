import * as assert from 'assert';

import { Serializer } from '../src/interface/serializable.js';

test('serializable', () => {
    const serializer = Serializer.pipe(Serializer.json(), Serializer.textBytes());
    const data = { hello: 'world' };
    const serialized = serializer.serialize(data);
    const deserialized = serializer.deserialize(serialized);
    assert.deepStrictEqual(data, deserialized);
});

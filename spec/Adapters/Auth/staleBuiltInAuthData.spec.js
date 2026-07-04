'use strict';

const Config = require('../../../lib/Config');

describe('built-in code auth adapters afterFind with provider turned off', () => {
  // Both of these go through the shared BaseCodeAuthAdapter path, so they show the same break.
  [
    { provider: 'line', objectId: 'LINEAFTERFIND1' },
    { provider: 'instagram', objectId: 'INSTAGRAMAFTER1' },
  ].forEach(({ provider, objectId }) => {
    it_only_db('mongo')(
      `should not crash fetching a user when stale _auth_data_${provider} exists but auth.${provider} is not configured`,
      async () => {
        await reconfigureServer({ auth: {} });
        const database = Config.get(Parse.applicationId).database;
        const collection = await database.adapter._adaptiveCollection('_User');
        await collection.insertOne({
          _id: objectId,
          username: `<some_${provider}_username>`,
          email: `<some_${provider}_email>`,
          _hashed_password: '<some_password>',
          [`_auth_data_${provider}`]: {
            id: 'linkedID',
            access_token: 'stale-token',
          },
        });

        // Old rows can still have built-in auth data even after that provider got turned off in server config.
        const user = await new Parse.Query(Parse.User).get(objectId, { useMasterKey: true });
        expect(user.id).toBe(objectId);
      }
    );
  });
});

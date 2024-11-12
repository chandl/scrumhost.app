import PocketBase from 'pocketbase';

const PROD_URL = 'https://api.scrum.host';

export const COLLECTIONS = ['users', 'participants', 'rooms', 'stories', 'story_estimates'];

const pb = new PocketBase(PROD_URL);

export default pb;

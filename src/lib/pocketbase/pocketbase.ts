import PocketBase from 'pocketbase';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

export const COLLECTIONS = ['users', 'participants', 'rooms', 'stories', 'story_estimates'];

const pb = new PocketBase(PUBLIC_BACKEND_URL);

export default pb;

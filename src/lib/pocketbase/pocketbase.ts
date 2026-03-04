import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';

export const COLLECTIONS = ['users', 'participants', 'rooms', 'stories', 'story_estimates'];

const pb = new PocketBase(env.PUBLIC_BACKEND_URL ?? 'http://localhost:8090');

export default pb;

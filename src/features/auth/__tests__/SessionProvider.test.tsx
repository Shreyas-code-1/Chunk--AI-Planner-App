import React from 'react';
import { SessionProvider, useSession } from '../SessionProvider';
import { getSupabase, isSupabaseConfigured } from '../../../lib/supabase';
const {act,create}=require('react-test-renderer');
jest.mock('../../../lib/supabase',()=>({getSupabase:jest.fn(),isSupabaseConfigured:jest.fn()}));
let state: ReturnType<typeof useSession>;let tree:any;let event:(name:string,session:any)=>void;
const getSession=jest.fn(); const signOut=jest.fn(); const unsubscribe=jest.fn();
function Probe(){state=useSession();return null;}
async function mount(){await act(async()=>{tree=create(<SessionProvider><Probe /></SessionProvider>)});}
beforeEach(()=>{jest.mocked(isSupabaseConfigured).mockReturnValue(true);getSession.mockResolvedValue({data:{session:null},error:null});jest.mocked(getSupabase).mockReturnValue({auth:{getSession,signOut,onAuthStateChange:(callback:any)=>{event=callback;return {data:{subscription:{unsubscribe}}}}}} as any);});
afterEach(()=>{if(tree)act(()=>tree.unmount());jest.clearAllMocks();});
test('empty restoration finishes without blocking startup',async()=>{await mount();expect(state.loading).toBe(false);expect(state.session).toBeNull();});
test('authenticated restoration supplies session',async()=>{getSession.mockResolvedValueOnce({data:{session:{user:{id:'user'}}},error:null});await mount();expect(state.session?.user.id).toBe('user');});
test('pending restoration remains loading',async()=>{getSession.mockReturnValueOnce(new Promise(()=>{}));await mount();expect(state.loading).toBe(true);});
test.each(['returned','rejected'])('%s restoration failure is sanitized and releases loading',async kind=>{const warn=jest.spyOn(console,'warn').mockImplementation(()=>{});if(kind==='returned')getSession.mockResolvedValueOnce({data:{session:null},error:new Error('secret')});else getSession.mockRejectedValueOnce(new Error('secret'));await mount();expect(state.loading).toBe(false);expect(warn).toHaveBeenCalledWith('[session] restore-failed');warn.mockRestore();});
test('new auth event cannot be overwritten by late initial restoration',async()=>{let finish:any;getSession.mockReturnValueOnce(new Promise(resolve=>finish=resolve));await mount();await act(async()=>event('SIGNED_IN',{user:{id:'new'}}));await act(async()=>finish({data:{session:null},error:null}));expect(state.session?.user.id).toBe('new');expect(state.loading).toBe(false);});
test('missing configuration does not block the route tree',async()=>{jest.mocked(isSupabaseConfigured).mockReturnValueOnce(false);await mount();expect(state.loading).toBe(false);expect(state.configError).toBeTruthy();});
test('signOut preserves SDK failure semantics',async()=>{await mount();signOut.mockResolvedValueOnce({error:null});await expect(state.signOut()).resolves.toBeUndefined();const error=new Error('failure');signOut.mockResolvedValueOnce({error});await expect(state.signOut()).rejects.toBe(error);});

import React from 'react';
import { TextInput } from 'react-native';
import Add from '../../../app/(app)/add';
import Focus from '../../../app/(app)/focus';
import Home from '../../../app/(app)/home';
import Today from '../../../app/(app)/today';
import Paywall from '../../../app/(onboarding)/paywall';
import { useWork } from '../store';
import { useDraft } from '../../onboarding/draft';
const {act,create}=require('react-test-renderer');
const mockRouter={push:jest.fn(),replace:jest.fn(),back:jest.fn(),canGoBack:jest.fn(()=>false)};
let mockParams:any={};let tree:any;
jest.mock('react-native-safe-area-context',()=>({...jest.requireActual('react-native-safe-area-context'),useSafeAreaInsets:()=>({top:0,bottom:0,left:0,right:0})}));
jest.mock('expo-crypto',()=>({randomUUID:()=>require('crypto').randomUUID()}));
jest.mock('@react-native-async-storage/async-storage',()=>require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-router',()=>({useRouter:()=>mockRouter,useLocalSearchParams:()=>mockParams,useFocusEffect:(fn:any)=>require('react').useEffect(fn,[fn])}));
jest.mock('../../../components/ui',()=>{
  const React=require('react'),{View,Pressable,Text}=require('react-native');
  const Wrapper=({children,...props}:any)=><View {...props}>{children}</View>;
  return {Button:({label,...props}:any)=><Pressable {...props}><Text>{label}</Text></Pressable>,Chip:Wrapper,PathNode:Wrapper,OrangeGradient:Wrapper,ProgressRing:Wrapper,ScreenScroll:Wrapper};
});
jest.mock('../../../lib/haptics',()=>({haptic:jest.fn()}));
jest.mock('../../billing/useOffering',()=>({useOffering:()=>({data:undefined,isPending:false,isError:false,isFetching:false,refetch:jest.fn()})}));

function render(Screen:any){act(()=>{tree=create(<Screen />)});}
function actionWithText(label:string){let node=tree.root.findAll((n:any)=>n.props.children===label)[0];while(node&&!node.props.onPress)node=node.parent;expect(node).toBeTruthy();return node;}
function named(label:string){return tree.root.findAll((n:any)=>n.props.accessibilityLabel===label&&n.props.onPress)[0];}
beforeEach(()=>{jest.useFakeTimers();useWork.getState().reset();useDraft.getState().reset();mockParams={};jest.clearAllMocks();mockRouter.canGoBack.mockReturnValue(false);});
afterEach(()=>{if(tree)act(()=>tree.unmount());tree=undefined;jest.useRealTimers();});
test('Add Assignment direct-launch Back safely returns Home',()=>{render(Add);act(()=>named('Go back').props.onPress());expect(mockRouter.back).not.toHaveBeenCalled();expect(mockRouter.replace).toHaveBeenCalledWith('/home');});
test('Add Assignment preserves actual previous history',()=>{mockRouter.canGoBack.mockReturnValue(true);render(Add);act(()=>named('Go back').props.onPress());expect(mockRouter.back).toHaveBeenCalledTimes(1);});
test('invalid Focus route cannot generate a fake completion',()=>{mockParams={assignment:'missing',minutes:'NaN',title:'Task'};render(Focus);expect(useWork.getState().active).toBeNull();expect(useWork.getState().completions).toEqual([]);});
test('Focus leaving via Back abandons exactly once and uses Today fallback',()=>{const a=useWork.getState().addAssignment({title:'Task',className:null,dueAt:new Date(),minutes:20,dread:'meh',mode:'reading',firstAction:null,notes:''});mockParams={assignment:a.id,title:a.title,minutes:'20'};render(Focus);act(()=>named('Leave the session').props.onPress());expect(useWork.getState().active).toBeNull();expect(useWork.getState().abandoned).toHaveLength(1);expect(mockRouter.replace).toHaveBeenCalledWith('/today');act(()=>tree.unmount());tree=undefined;expect(useWork.getState().abandoned).toHaveLength(1);});
test('Focus navigation blur/system Back records abandonment without persisting unfinished work',()=>{const a=useWork.getState().addAssignment({title:'Task',className:null,dueAt:new Date(),minutes:20,dread:null,mode:'reading',firstAction:null,notes:''});mockParams={assignment:a.id,title:a.title,minutes:'20'};render(Focus);act(()=>tree.unmount());tree=undefined;expect(useWork.getState().active).toBeNull();expect(useWork.getState().abandoned).toHaveLength(1);});
// The paywall's CTA now purchases through RevenueCat (covered in billing/__tests__/paywall.test.tsx); skipping still completes onboarding.
test.each(['NO THANKS'])('Paywall %s marks onboarding complete before account navigation',label=>{render(Paywall);const action=actionWithText(label);act(()=>action.props.onPress());expect(useDraft.getState().completed).toBe(true);expect(mockRouter.replace).toHaveBeenCalledWith('/login');});

test.each([Home,Today])('Home/Today mounts with clean-install stores without navigation warnings',Screen=>{render(Screen);expect(tree.toJSON()).toBeTruthy();expect(mockRouter.back).not.toHaveBeenCalled();});
test('Add Assignment saves the actual student input and routes to generated chunks',()=>{render(Add);const input=tree.root.findAllByType(TextInput)[0];act(()=>input.props.onChangeText('Read chapter 4'));const save=tree.root.findAll((n:any)=>n.props.label&&/CHUNK|SAVE|ADD/.test(n.props.label)&&n.props.onPress)[0];expect(save).toBeTruthy();act(()=>save.props.onPress());expect(useWork.getState().assignments).toHaveLength(1);expect(mockRouter.replace).toHaveBeenCalledWith({pathname:'/chunked',params:{assignment:useWork.getState().assignments[0].id}});});

test('finishing early records one real completion and does not navigate twice on repeated taps',()=>{
  const a=useWork.getState().addAssignment({title:'Task',className:null,dueAt:new Date(),minutes:20,dread:null,mode:'reading',firstAction:null,notes:''});
  mockParams={assignment:a.id,title:a.title,minutes:'20'};render(Focus);
  act(()=>jest.advanceTimersByTime(120000));
  const finish=actionWithText('FINISH CHUNK');
  act(()=>{finish.props.onPress();finish.props.onPress();});
  expect(useWork.getState().completions).toHaveLength(1);expect(useWork.getState().completions[0].actualMinutes).toBe(2);
  expect(mockRouter.replace).toHaveBeenCalledTimes(1);
});

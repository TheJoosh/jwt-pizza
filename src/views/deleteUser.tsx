import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { pizzaService } from '../service/service';
import View from './view';
import Button from '../components/button';
import { useBreadcrumb } from '../hooks/appNavigation';

export default function DeleteUser() {
  const state = useLocation().state;
  const navigateToParentPath = useBreadcrumb();
  const navigate = useNavigate();

  async function kill() {
    await pizzaService.deleteUser(state.user);
    navigate(-1);
  }

  return (
    <View title='Sorry to see you go'>
      <div className='text-start py-8 px-4 sm:px-6 lg:px-8'>
        <div className='text-neutral-100'>
          Are you sure you want to delete <span className='text-orange-500'>{state.user.name}</span> ({state.user.email})? This cannot be restored.
        </div>
        <Button title='Delete' onPress={kill} />
        <Button title='Cancel' onPress={() => navigate(-1)} className='bg-transparent border-neutral-300' />
      </div>
    </View>
  );
}

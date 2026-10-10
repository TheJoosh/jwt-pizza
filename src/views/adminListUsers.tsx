import React from 'react';
import View from './view';
import NotFound from './notFound';
import { pizzaService } from '../service/service';
import { Role, User } from '../service/pizzaService';

interface Props {
  user: User | null;
}

export default function AdminListUsers(props: Props) {
  const [users, setUsers] = React.useState<User[]>([]);

  React.useEffect(() => {
    (async () => {
      setUsers(await pizzaService.getUsers());
    })();
  }, [props.user]);

  if (!Role.isRole(props.user, Role.Admin)) {
    return <NotFound />;
  }

  return (
    <View title="Mama Ricci's kitchen">
      <div className="text-start py-8 px-4 sm:px-6 lg:px-8">
        <h3 className="text-neutral-100 text-xl">Users</h3>
        <div className="bg-neutral-100 overflow-clip my-4">
          <div className="flex flex-col">
            <div className="-m-1.5 overflow-x-auto">
              <div className="p-1.5 min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="uppercase text-neutral-100 bg-slate-400 border-b-2 border-gray-500">
                      <tr>
                        {['Name', 'Email', 'Roles'].map((header) => (
                          <th key={header} scope="col" className="px-6 py-3 text-center text-xs font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((listedUser, index) => (
                        <tr key={listedUser.id ?? index} className="hover:bg-gray-100">
                          <td className="px-6 py-4 text-sm text-center font-medium text-gray-800">{listedUser.name}</td>
                          <td className="px-6 py-4 text-sm text-center text-gray-800">{listedUser.email}</td>
                          <td className="px-6 py-4 text-sm text-center text-gray-800">{listedUser.roles?.map((role) => role.role).join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </View>
  );
}
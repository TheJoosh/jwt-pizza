import React from 'react';
import View from './view';
import NotFound from './notFound';
import { pizzaService } from '../service/service';
import { Role, User } from '../service/pizzaService';
import Button from '../components/button';
import { useNavigate } from 'react-router-dom';
import { TrashIcon } from '../icons';

interface Props {
  user: User | null;
}

const USERS_PER_PAGE = 10;

export default function AdminListUsers(props: Props) {
  const navigate = useNavigate();
  const [users, setUsers] = React.useState<User[]>([]);
  const [userPage, setUserPage] = React.useState(0);

  React.useEffect(() => {
    (async () => {
      setUsers(await pizzaService.getUsers());
      setUserPage(0);
    })();
  }, [props.user]);

  if (!Role.isRole(props.user, Role.Admin)) {
    return <NotFound />;
  }

  const pageUsers = users.slice(userPage * USERS_PER_PAGE, (userPage + 1) * USERS_PER_PAGE);
  const hasNextPage = (userPage + 1) * USERS_PER_PAGE < users.length;

  function createFranchise() {
    navigate('/admin-dashboard/create-franchise');
  }

  function deleteUser(user: User) {
    navigate('/admin-dashboard/delete-user', { state: { user } });
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
                        {['Name', 'Email', 'Roles', 'Action'].map((header) => (
                          <th key={header} scope="col" className="px-6 py-3 text-center text-xs font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pageUsers.map((listedUser, index) => (
                        <tr key={listedUser.id ?? index} className="hover:bg-gray-100">
                          <td className="px-6 py-4 text-sm text-center font-medium text-gray-800">{listedUser.name}</td>
                          <td className="px-6 py-4 text-sm text-center text-gray-800">{listedUser.email}</td>
                          <td className="px-6 py-4 text-sm text-center text-gray-800">{listedUser.roles?.map((role) => role.role).join(', ')}</td>
                          <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                            <button
                              type="button"
                              className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800"
                              onClick={() => deleteUser(listedUser)}>
                              <TrashIcon />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="text-end text-sm font-medium">
                          <button
                            className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300"
                            onClick={() => setUserPage(userPage - 1)}
                            disabled={userPage <= 0}>
                            «
                          </button>
                          <button
                            className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300"
                            onClick={() => setUserPage(userPage + 1)}
                            disabled={!hasNextPage}>
                            »
                          </button>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        <div>
        <Button className="w-36 text-xs sm:text-sm sm:w-64" title="Back to Dashboard" onPress={() => navigate('/admin-dashboard/')} />
        <Button className="w-36 text-xs sm:text-sm sm:w-64" title="Add Franchise" onPress={createFranchise} />
        </div>
    </View>
  );
}
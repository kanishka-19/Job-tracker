import { useEffect, useState } from "react";
import { getUserProfile } from "../../api/user";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserProfile()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!user) return <div className="text-center py-8 text-red-600">Profile not found.</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-10 rounded-xl shadow-lg mt-16">
      <div className="flex items-center gap-8 mb-8">
        <img
          src={user.avatarUrl || "/default-avatar.png"}
          alt="Avatar"
          className="w-32 h-32 rounded-full object-cover border-2 border-blue-500"
        />
        <div>
          <div className="text-2xl font-bold">{user.name}</div>
          <div className="text-gray-600 text-lg">{user.email}</div>
        </div>
      </div>
      <div className="space-y-3 mb-6">
        {user.headline && (
          <div>
            <span className="font-semibold text-gray-700">Headline:</span>{" "}
            <span className="text-gray-800">{user.headline}</span>
          </div>
        )}
        {user.location && (
          <div>
            <span className="font-semibold text-gray-700">Location:</span>{" "}
            <span className="text-gray-800">{user.location}</span>
          </div>
        )}
        {user.bio && (
          <div>
            <span className="font-semibold text-gray-700">Bio:</span>{" "}
            <span className="text-gray-800">{user.bio}</span>
          </div>
        )}
      </div>
      <div className="mb-6">
        <span className="font-semibold text-gray-700">Resume:</span>{" "}
        {user.resumeUrl ? (
          <a
            href={user.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline font-medium"
          >
            View Resume
          </a>
        ) : (
          <span className="text-gray-400">No resume uploaded</span>
        )}
      </div>
      <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold">
        Edit Profile
      </button>
    </div>
  );
}
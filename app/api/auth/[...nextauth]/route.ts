import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import RedditProvider from 'next-auth/providers/reddit';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.username === 'admin' && credentials?.password === 'admin') {
          return { id: "1", name: "Admin", email: "admin@example.com" };
        } else {
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    RedditProvider({
      clientId: process.env.REDDIT_CLIENT_ID ?? '',
      clientSecret: process.env.REDDIT_CLIENT_SECRET ?? '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };

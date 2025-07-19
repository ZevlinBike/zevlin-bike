import React from 'react';
import Container from '../shared/Container';

const Footer: React.FC = () => (
  <footer className="border-t mt-12 py-6 text-sm text-gray-600">
    <Container className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex space-x-4">
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/cart">Cart</a>
      </div>
      <div>&copy; {new Date().getFullYear()} Zevlin Bike</div>
      <div className="flex space-x-2">
        {/* NewsletterSignup and SocialIcons will go here */}
        <span>Newsletter</span>
        <span>Social</span>
      </div>
    </Container>
  </footer>
);

export default Footer; 
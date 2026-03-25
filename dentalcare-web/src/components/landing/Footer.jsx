export default function Footer() {
  return (
    <footer id="contact" className="w-full px-3 pb-4 pt-0 sm:px-4 lg:px-6">
      <div className="w-full rounded-[30px] border border-pink-200/70 bg-white px-6 py-10 shadow-[0_10px_40px_rgba(236,72,153,0.08)] sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-400 font-bold text-white">
                GC
              </div>
              <div>
                <h3 className="font-bold text-slate-900">GC Dental Care</h3>
                <p className="text-sm text-slate-500">Powered by IntelliDent</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              A smarter dental clinic experience with modern appointment
              booking, patient support, and organized dashboard management.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900">Quick Links</h4>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p><a href="#about" className="hover:text-pink-600">About Us</a></p>
              <p><a href="#services" className="hover:text-pink-600">Services</a></p>
              <p><a href="#specialist" className="hover:text-pink-600">Specialist</a></p>
              <p><a href="#overview" className="hover:text-pink-600">Application Overview</a></p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900">System Access</h4>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Dentist Login</p>
              <p>Admin Login</p>
              <p>Mobile Application</p>
              <p>Appointment Monitoring</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900">Contacts</h4>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Email: gcdentalcare@gmail.com</p>
              <p>Phone: +63 912 345 6789</p>
              <p>Address: Dasmariñas, Cavite, Philippines</p>
              <p>Facebook: GC Dental Care</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-pink-100 pt-5 text-center text-sm text-slate-500">
          © 2026 GC Dental Care | IntelliDent. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
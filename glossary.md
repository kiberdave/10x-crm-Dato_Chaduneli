# Glossary

Ten technical terms used in this project, in English with a Georgian
explanation in my own words.

**1. Authentication**
*"Authentication checks that the email and password entered on the
login form match a stored user."*
ქართულად: პროცესი, რომლითაც სისტემა ამოწმებს ხარ თუ არა ის, ვინც
ამტკიცებ რომ ხარ — ჩვენს შემთხვევაში email + password-ის შედარებით.

**2. Session**
*"A session object is created on successful login and stored under the
`crm_session` key until the user logs out."*
ქართულად: მიმდინარე შესვლის მდგომარეობა — ინახავს ვინ არის ახლა
ავტორიზებული, სანამ არ მოხდება logout.

**3. Validation**
*"Validation runs on form submit and rejects the request if any field
breaks a rule, such as a password shorter than 8 characters."*
ქართულად: შეყვანილი მონაცემის სისწორის შემოწმება submit-ის დროს,
სანამ ის დაინახება localStorage-ში.

**4. Fetch**
*"The `fetch` function sends an HTTP request to the DummyJSON API and
returns a Promise that resolves with the response."*
ქართულად: ბრაუზერის ჩაშენებული ფუნქცია, რომლითაც ვაგზავნით მოთხოვნას
სერვერზე და ველოდებით პასუხს.

**5. Endpoint**
*"`https://dummyjson.com/users/add` is the endpoint used to create a
new client record."*
ქართულად: კონკრეტული URL სერვერზე, რომელიც ერთ კონკრეტულ მოქმედებას
ემსახურება (მაგ. დამატება, წაშლა).

**6. Request method**
*"GET loads clients, POST adds a new one, and DELETE removes one — each
is a different request method."*
ქართულად: HTTP მოთხოვნის ტიპი, რომელიც განსაზღვრავს რა მოქმედებას
ვასრულებთ სერვერზე.

**7. JSON**
*"The API response body is parsed from JSON into a plain JavaScript
object with `response.json()`."*
ქართულად: ტექსტური ფორმატი მონაცემების გადასაცემად, რომელიც ადვილად
გარდაიქმნება JavaScript-ის ობიექტად.

**8. State**
*"The `clientsState` array is the single source of truth the UI is
rendered from after every change."*
ქართულად: აპლიკაციის მიმდინარე მონაცემები მეხსიერებაში, საიდანაც
იხატება ეკრანი.

**9. Event listener**
*"An event listener on the delete button calls `handleDeleteClient`
whenever it's clicked."*
ქართულად: ფუნქცია, რომელიც ელოდება კონკრეტულ მოქმედებას (click,
submit, change) და რეაგირებს მასზე.

**10. Deployment**
*"Deployment is the process of publishing the static site to Vercel so
it has a public, live URL."*
ქართულად: მზა აპლიკაციის საჯარო სერვერზე გამოქვეყნების პროცესი.

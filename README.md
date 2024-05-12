
# A Device Management System
- A Management System with various functionality. This project contains 3 user levels (employee , admin , director). The login details of every user has been hashed separately and stores in local mongoDb.
- Employees have permissions to request devices,events, meetings,apply for bill reimbursements and many more.
- While admin has rights to approve employee requests. Admin also has permissions to directly add new device to a employee without employee requesting.
- The director being the highest level in this three tier system has permission to reject as well as accept employee requests event if those have been approved or rejected by admin.
- Admin can create new login id and password for employees whereas director can create new login id and password for both employee and admins.



 
## Run Locally

Clone the project

```bash
  git clone https://github.com/jayesh0104/Device-Management.git
```

Go to the project directory

```bash
  cd Device-Management
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  node login.js 
  nodemon index.js
```


## Authors
Jayesh Daga
- [Github](https://www.github.com/jayesh0104/)
- [Instagram](https://www.instagram.com/dagajayesh/?hl=en)



## Screenshots

![Admin Screenshot](https://drive.google.com/file/d/1Roia8TQCf4anTlrgWAZa7lnyJgenx1AH/view?usp=sharing)
![Add Employee Screenshot](https://drive.google.com/file/d/1BOK8bchi8COxeLOxY3ZsIinb3xdNrDbh/view?usp=drive_link)
![Director Login Screenshot](https://drive.google.com/file/d/1FzuzS5FHwsl0AaAZauO4NS_ktKmjZ18p/view?usp=sharing)
![Employee Panel Screenshot](https://drive.google.com/file/d/1Yo557T9sWSYC1HKmyd0JO1vCp6jZ4xnS/view?usp=sharing)


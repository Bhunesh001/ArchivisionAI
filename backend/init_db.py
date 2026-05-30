"""
Run this script once to initialize the database and create a demo user.
Usage: python backend/init_db.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app import app, db, User, Project, generate_floor_plan
import json

with app.app_context():
    db.create_all()
    print("✅ Tables created.")

    # Demo user
    if not User.query.filter_by(email='demo@Archivision.ai').first():
        u = User(username='demo', email='demo@Archivision.ai', first_name='Demo', last_name='User')
        u.set_password('demo1234')
        db.session.add(u)
        db.session.flush()

        # Sample projects
        samples = [
            dict(name='Modern Family Home', building_type='house',
                 plot_width=60, plot_length=80, parking_spaces=2,
                 open_space_percentage=25, number_of_floors=2, color_theme='modern'),
            dict(name='Downtown Office', building_type='office',
                 plot_width=100, plot_length=120, parking_spaces=10,
                 open_space_percentage=10, number_of_floors=5, color_theme='cool'),
            dict(name='Corner Restaurant', building_type='restaurant',
                 plot_width=50, plot_length=60, parking_spaces=5,
                 open_space_percentage=15, number_of_floors=1, color_theme='warm'),
        ]
        for s in samples:
            fp = generate_floor_plan(s['plot_width'], s['plot_length'],
                                     s['building_type'], s['parking_spaces'],
                                     s['open_space_percentage'], s['number_of_floors'])
            p = Project(user_id=u.id, name=s['name'],
                        building_type=s['building_type'],
                        plot_width=s['plot_width'], plot_length=s['plot_length'],
                        plot_area=s['plot_width']*s['plot_length'],
                        parking_spaces=s['parking_spaces'],
                        open_space_percentage=s['open_space_percentage'],
                        number_of_floors=s['number_of_floors'],
                        color_theme=s['color_theme'],
                        floor_plan_data=json.dumps(fp),
                        budget_estimate=fp['estimated_cost'])
            db.session.add(p)

        db.session.commit()
        print("✅ Demo user created.")
        print("   Email:    demo@Archivision.ai")
        print("   Password: demo1234")
    else:
        print("ℹ️  Demo user already exists.")

    print("\n🚀 Database ready. Run: python backend/app.py")

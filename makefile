all:
	now rm `now ls | cut -d ' ' -f 2 | tail -n 2` -y --safe
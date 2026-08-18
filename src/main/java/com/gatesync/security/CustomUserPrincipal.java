package com.gatesync.security;

import com.gatesync.model.Role;
import com.gatesync.model.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
public class CustomUserPrincipal implements UserDetails {

    private final Long userId;
    private final String loginId;
    private final String password;
    private final Role role;
    private final String societyId;
    private final String blockNumber;
    private final String flatNumber;
    private final boolean mustResetPassword;
    private final boolean active;
    private final boolean accountLocked;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserPrincipal(User user) {
        this.userId = user.getId();
        this.loginId = user.getLoginId();
        this.password = user.getPassword();
        this.role = user.getRole();
        this.societyId = user.getSocietyId() != null ? user.getSocietyId() : "SOC-101";
        this.blockNumber = user.getBlockNumber();
        this.flatNumber = user.getFlatNumber();
        this.mustResetPassword = user.isMustResetPassword();
        this.active = user.isActive();
        this.accountLocked = user.isAccountLocked();
        this.authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return loginId;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !accountLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
